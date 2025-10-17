// ==================== STORAGE MANAGER ====================

class StorageManager {
    constructor() {
        this.uploadProgress = new Map();
        this.currentProjectId = null;
    }

    // Initialize storage for a project
    async initProjectStorage(projectId) {
        this.currentProjectId = projectId;
        return this.loadProjectFiles(projectId);
    }

    // Upload file to Firebase Storage
    async uploadFile(file, projectId, category = 'general') {
        try {
            // Validate file
            if (!this.validateFile(file)) {
                throw new Error('Invalid file type or size');
            }

            const fileId = this.generateFileId();
            const fileName = this.sanitizeFileName(file.name);
            const storagePath = `projects/${projectId}/${category}/${fileId}_${fileName}`;

            // Create storage reference
            const storageRef = storage.ref(storagePath);

            // Create upload task
            const uploadTask = storageRef.put(file);

            // Monitor upload progress
            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // Progress
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        this.updateProgress(fileId, progress);
                        this.showUploadProgress(fileName, progress);
                    },
                    (error) => {
                        // Error
                        console.error('Upload error:', error);
                        this.showUploadError(fileName, error.message);
                        reject(error);
                    },
                    async () => {
                        // Complete
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                        // Save file metadata to Firestore
                        const fileData = {
                            fileId,
                            projectId,
                            category,
                            fileName,
                            originalName: file.name,
                            fileType: file.type,
                            fileSize: file.size,
                            fileExtension: this.getFileExtension(file.name),
                            storagePath,
                            downloadURL,
                            uploadedBy: authManager.currentUser.email,
                            uploadedByName: authManager.userInfo.name,
                            uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            tags: [],
                            version: 1,
                            isActive: true
                        };

                        const result = await dbManager.create('projectFiles', fileData);

                        if (result.success) {
                            this.showUploadSuccess(fileName);

                            // Update project file count
                            await this.updateProjectFileCount(projectId, 1);

                            // Add to timeline
                            await dbManager.create('timeline', {
                                type: 'file_uploaded',
                                title: `File uploaded: ${fileName}`,
                                description: `Uploaded to ${category}`,
                                icon: '📁',
                                linkedId: projectId,
                                linkedType: 'project',
                                createdBy: authManager.currentUser.email,
                                authorName: authManager.userInfo.name,
                                authorAvatar: authManager.userInfo.avatar
                            });

                            resolve({
                                success: true,
                                fileId: result.id,
                                downloadURL,
                                fileData
                            });
                        } else {
                            reject(new Error('Failed to save file metadata'));
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, error: error.message };
        }
    }

    // Load project files
    async loadProjectFiles(projectId) {
        try {
            const files = await db.collection('projectFiles')
                .where('projectId', '==', projectId)
                .where('isActive', '==', true)
                .orderBy('uploadedAt', 'desc')
                .get();

            const fileList = files.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return { success: true, files: fileList };
        } catch (error) {
            console.error('Error loading files:', error);
            return { success: false, error: error.message, files: [] };
        }
    }

    // Delete file
    async deleteFile(fileId, storagePath) {
        try {
            // Delete from Storage
            const storageRef = storage.ref(storagePath);
            await storageRef.delete();

            // Mark as inactive in Firestore (soft delete)
            await dbManager.update('projectFiles', fileId, {
                isActive: false,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: authManager.currentUser.email
            });

            return { success: true };
        } catch (error) {
            console.error('Delete error:', error);
            return { success: false, error: error.message };
        }
    }

    // Create folder structure for project
    async createProjectFolders(projectId) {
        const folders = [
            'designs',
            'resources',
            'references',
            'exports',
            'documents',
            'feedback'
        ];

        const folderData = folders.map(folderName => ({
            projectId,
            folderName,
            folderPath: `projects/${projectId}/${folderName}`,
            createdBy: authManager.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }));

        // Batch create folders
        const batch = db.batch();
        folderData.forEach(folder => {
            const docRef = db.collection('projectFolders').doc();
            batch.set(docRef, folder);
        });

        await batch.commit();
        return { success: true, folders: folderData };
    }

    // Render file manager UI
    renderFileManager(containerId, projectId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
      <div class="file-manager glass-card">
        <div class="file-manager-header">
          <h3 class="gradient-text">
            <i data-lucide="folder-open"></i>
            Project Files
          </h3>
          <div class="file-actions">
            <button class="btn btn-gradient btn-sm" onclick="storageManager.showUploadModal('${projectId}')">
              <i data-lucide="upload"></i>
              Upload Files
            </button>
            <button class="btn btn-secondary btn-sm" onclick="storageManager.createFolder('${projectId}')">
              <i data-lucide="folder-plus"></i>
              New Folder
            </button>
          </div>
        </div>
        
        <div class="file-categories">
          <div class="category-tab active" data-category="all">
            <i data-lucide="grid"></i>
            All Files
          </div>
          <div class="category-tab" data-category="designs">
            <i data-lucide="image"></i>
            Designs
          </div>
          <div class="category-tab" data-category="documents">
            <i data-lucide="file-text"></i>
            Documents
          </div>
          <div class="category-tab" data-category="resources">
            <i data-lucide="package"></i>
            Resources
          </div>
        </div>
        
        <div class="file-upload-zone" id="fileDropZone">
          <div class="upload-zone-content">
            <i data-lucide="cloud-upload"></i>
            <p>Drag & drop files here or click to browse</p>
            <input type="file" id="fileInput" multiple style="display: none;">
          </div>
        </div>
        
        <div class="file-grid" id="fileGrid">
          <!-- Files will be rendered here -->
        </div>
      </div>
    `;

        this.setupDropZone(projectId);
        this.loadAndRenderFiles(projectId);
        lucide.createIcons();
    }

    // Setup drag & drop zone
    setupDropZone(projectId) {
        const dropZone = document.getElementById('fileDropZone');
        const fileInput = document.getElementById('fileInput');

        if (!dropZone || !fileInput) return;

        // Click to browse
        dropZone.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, projectId);
        });

        // Drag & Drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files, projectId);
        });
    }

    // Handle multiple file uploads
    async handleFiles(files, projectId) {
        const fileArray = Array.from(files);
        const uploadPromises = [];

        for (const file of fileArray) {
            uploadPromises.push(this.uploadFile(file, projectId));
        }

        const results = await Promise.allSettled(uploadPromises);

        // Refresh file list
        this.loadAndRenderFiles(projectId);

        // Show summary
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        if (successful > 0) {
            app.showToast(`${successful} file(s) uploaded successfully`, 'success');
        }
        if (failed > 0) {
            app.showToast(`${failed} file(s) failed to upload`, 'error');
        }
    }

    // Load and render files
    async loadAndRenderFiles(projectId) {
        const result = await this.loadProjectFiles(projectId);
        const grid = document.getElementById('fileGrid');

        if (!grid) return;

        if (!result.success || result.files.length === 0) {
            grid.innerHTML = `
        <div class="empty-files">
          <i data-lucide="folder-open"></i>
          <p>No files uploaded yet</p>
        </div>
      `;
            lucide.createIcons();
            return;
        }

        grid.innerHTML = result.files.map(file => this.renderFileCard(file)).join('');
        lucide.createIcons();
    }

    // Render file card
    renderFileCard(file) {
        const icon = this.getFileIcon(file.fileExtension);
        const size = this.formatFileSize(file.fileSize);
        const color = FILE_TYPES[file.fileExtension]?.color || '#667eea';

        return `
      <div class="file-card animated-file-card" data-file-id="${file.id}">
        <div class="file-preview" style="background: ${color}15; color: ${color};">
          ${icon}
        </div>
        <div class="file-info">
          <div class="file-name" title="${file.fileName}">${this.truncateFileName(file.fileName)}</div>
          <div class="file-meta">
            <span>${size}</span>
            <span>•</span>
            <span>${dbManager.formatRelativeTime(file.uploadedAt)}</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn-file-action" onclick="storageManager.downloadFile('${file.downloadURL}', '${file.fileName}')">
            <i data-lucide="download"></i>
          </button>
          <button class="btn-file-action" onclick="storageManager.previewFile('${file.downloadURL}', '${file.fileType}', '${file.fileName}')">
            <i data-lucide="eye"></i>
          </button>
          ${authManager.canDelete() ? `
            <button class="btn-file-action danger" onclick="storageManager.deleteFile('${file.id}', '${file.storagePath}')">
              <i data-lucide="trash-2"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
    }

    // File validation
    validateFile(file) {
        const maxSize = 100 * 1024 * 1024; // 100MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
            'application/pdf', 'application/zip', 'application/x-rar-compressed',
            'application/vnd.adobe.photoshop', 'application/postscript',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (file.size > maxSize) {
            app.showToast(`File ${file.name} is too large (max 100MB)`, 'error');
            return false;
        }

        // Allow all image types and common document types
        const isImage = file.type.startsWith('image/');
        const isAllowed = allowedTypes.includes(file.type);

        if (!isImage && !isAllowed) {
            app.showToast(`File type not allowed: ${file.type}`, 'error');
            return false;
        }

        return true;
    }

    // Helper functions
    generateFileId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    sanitizeFileName(fileName) {
        return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    }

    getFileExtension(fileName) {
        return fileName.split('.').pop().toLowerCase();
    }

    getFileIcon(extension) {
        const icons = {
            'pdf': '📄',
            'doc': '📝',
            'docx': '📝',
            'xls': '📊',
            'xlsx': '📊',
            'ppt': '📊',
            'pptx': '📊',
            'zip': '📦',
            'rar': '📦',
            'psd': '🎨',
            'ai': '🎨',
            'fig': '🎨',
            'sketch': '🎨',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼️',
            'svg': '📐',
            'mp4': '🎬',
            'mov': '🎬'
        };
        return icons[extension] || '📎';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    truncateFileName(fileName, maxLength = 25) {
        if (fileName.length <= maxLength) return fileName;
        const extension = fileName.split('.').pop();
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4) + '...';
        return truncatedName + '.' + extension;
    }

    updateProjectFileCount(projectId, increment) {
        return db.collection('projects').doc(projectId).update({
            fileCount: firebase.firestore.FieldValue.increment(increment)
        });
    }

    // UI feedback functions
    showUploadProgress(fileName, progress) {
        // Implementation for showing upload progress
        const progressBar = document.getElementById('uploadProgress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${Math.round(progress)}%`;
        }
    }

    showUploadSuccess(fileName) {
        app.showToast(`✅ ${fileName} uploaded successfully`, 'success');
    }

    showUploadError(fileName, error) {
        app.showToast(`❌ Failed to upload ${fileName}: ${error}`, 'error');
    }

    updateProgress(fileId, progress) {
        this.uploadProgress.set(fileId, progress);
    }

    // Download file
    downloadFile(url, fileName) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Preview file
    previewFile(url, fileType, fileName) {
        if (fileType.startsWith('image/')) {
            // Image preview
            const modalContent = `
        <div class="file-preview-modal">
          <img src="${url}" alt="${fileName}" style="max-width: 100%; height: auto;">
        </div>
      `;
            app.showModal(fileName, modalContent);
        } else if (fileType === 'application/pdf') {
            // PDF preview
            window.open(url, '_blank');
        } else {
            // Download for other types
            this.downloadFile(url, fileName);
        }
    }
}

// Create global instance
const storageManager = new StorageManager();

console.log('📁 Storage Manager Initialized');