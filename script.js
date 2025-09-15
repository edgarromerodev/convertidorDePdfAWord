// Elementos del DOM
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const uploadArea = document.getElementById('uploadArea');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const changeFileBtn = document.getElementById('changeFileBtn');
const convertButton = document.getElementById('convertButton');
const downloadButton = document.getElementById('downloadButton');
const progressContainer = document.getElementById('progressContainer');
const progressBarFill = document.getElementById('progressBarFill');
const progressPercentage = document.getElementById('progressPercentage');
const statusMessage = document.getElementById('statusMessage');

// Variables globales
let selectedFile = null;
let jobId = null;
let progressInterval = null;

// Event Listeners
uploadButton.addEventListener('click', () => {
    fileInput.click();
});

changeFileBtn.addEventListener('click', () => {
    resetUI();
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('active');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('active');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('active');
    
    if (e.dataTransfer.files.length) {
        handleFileSelection(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFileSelection(fileInput.files[0]);
    }
});

convertButton.addEventListener('click', startConversion);
downloadButton.addEventListener('click', downloadConvertedFile);

// Funciones
function handleFileSelection(file) {
    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
        showStatus('Por favor, selecciona un archivo PDF válido.', 'error');
        return;
    }
    
    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
        showStatus('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Mostrar información del archivo
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.add('active');
    
    // Habilitar botón de conversión
    convertButton.disabled = false;
    
    // Ocultar mensajes de estado
    hideStatus();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function startConversion() {
    if (!selectedFile) return;
    
    // Deshabilitar botones durante la conversión
    convertButton.disabled = true;
    downloadButton.style.display = 'none';
    
    // Mostrar barra de progreso
    progressContainer.classList.add('active');
    updateProgress(10);
    
    // Preparar formulario para enviar
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Simular progreso de carga (en un caso real, esto sería parte de la solicitud fetch)
    simulateProgress(10, 40, 1000, () => {
        // Realizar la solicitud al servidor
        fetch('http://localhost:3000/convert', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            jobId = data.id;
            updateProgress(60);
            checkJobStatus();
        })
        .catch(error => {
            showStatus('Error en la conversión: ' + error.message, 'error');
            resetProgress();
        });
    });
}

function simulateProgress(start, end, duration, callback) {
    let startTime = null;
    
    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const currentProgress = start + (end - start) * progress;
        
        updateProgress(currentProgress);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else if (callback) {
            callback();
        }
    }
    
    requestAnimationFrame(animate);
}

function updateProgress(percent) {
    const roundedPercent = Math.round(percent);
    progressBarFill.style.width = percent + '%';
    progressPercentage.textContent = roundedPercent + '%';
}

function checkJobStatus() {
    if (!jobId) return;
    
    // Simular progreso de conversión (en un caso real, esto vendría del servidor)
    simulateProgress(60, 90, 3000, () => {
        // En una implementación real, aquí haríamos la solicitud al servidor
        fetch(`http://localhost:3000/job/${jobId}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'successful') {
                updateProgress(100);
                showStatus('Conversión completada con éxito.', 'success');
                
                // Mostrar botón de descarga después de un breve delay
                setTimeout(() => {
                    downloadButton.style.display = 'block';
                }, 1000);
            } else if (data.status === 'failed') {
                throw new Error('La conversión ha fallado.');
            } else {
                // Si aún está procesando, verificar de nuevo después de un tiempo
                setTimeout(checkJobStatus, 2000);
            }
        })
        .catch(error => {
            showStatus('Error: ' + error.message, 'error');
            resetProgress();
        });
    });
}

function downloadConvertedFile() {
    if (!jobId) return;
    
    showStatus('Preparando descarga...', 'info');
    
    // En una implementación real, aquí haríamos la solicitud al servidor
    fetch(`http://localhost:3000/file/${jobId}`, {
        method: 'GET'
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_${selectedFile.name.replace('.pdf', '')}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        showStatus('Archivo descargado exitosamente.', 'success');
    })
    .catch(error => {
        showStatus('Error en la descarga: ' + error.message, 'error');
    });
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
}

function hideStatus() {
    statusMessage.style.display = 'none';
}

function resetProgress() {
    progressContainer.classList.remove('active');
    progressBarFill.style.width = '0%';
    progressPercentage.textContent = '0%';
    
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    // Rehabilitar botón de conversión
    convertButton.disabled = !selectedFile;
}

function resetUI() {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.classList.remove('active');
    convertButton.disabled = true;
    downloadButton.style.display = 'none';
    resetProgress();
    hideStatus();
}

// Para propósitos de demostración, simularemos la conversión si el servidor no está disponible
// En un entorno real, estas funciones se conectarían con el backend
window.startConversion = startConversion;
window.checkJobStatus = checkJobStatus;
window.downloadConvertedFile = downloadConvertedFile;