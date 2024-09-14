document.getElementById('uploadButton').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', () => {
    const fileInput = document.getElementById('fileInput');
    const status = document.getElementById('status');

    if (fileInput.files.length > 0) {
        status.textContent = `Archivo seleccionado: ${fileInput.files[0].name}`;
    } else {
        status.textContent = '';
    }
});

document.getElementById('convertButton').addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
    const status = document.getElementById('status');
    const downloadButton = document.getElementById('downloadButton');

    if (fileInput.files.length === 0) {
        status.textContent = 'Por favor, selecciona un archivo PDF.';
        return;
    }

    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:3000/convert', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }

        const jobId = data.id;
        checkJobStatus(jobId);
    })
    .catch(error => {
        status.textContent = 'Error en la conversión: ' + error.message;
    });
});

function checkJobStatus(jobId) {
    const status = document.getElementById('status');

    fetch(`http://localhost:3000/job/${jobId}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'successful') {
            const fileId = data.target_files[0].id;
            showDownloadButton(fileId);
        } else if (data.status === 'failed') {
            throw new Error('La conversión ha fallado.');
        } else {
            status.textContent = 'Conversión en progreso...';
            setTimeout(() => checkJobStatus(jobId), 5000);
        }
    })
    .catch(error => {
        status.textContent = 'Error en la conversión: ' + error.message;
    });
}

function showDownloadButton(fileId) {
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.style.display = 'block';
    downloadButton.addEventListener('click', () => downloadConvertedFile(fileId));
}

function downloadConvertedFile(fileId) {
    const status = document.getElementById('status');

    fetch(`http://localhost:3000/file/${fileId}`, {
        method: 'GET'
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_${fileId}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        status.textContent = 'Archivo descargado exitosamente.';
    })
    .catch(error => {
        status.textContent = 'Error en la descarga: ' + error.message;
    });
}