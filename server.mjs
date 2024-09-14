import express from 'express';
import fileUpload from 'express-fileupload';
import fetch from 'node-fetch';
import cors from 'cors';
import FormData from 'form-data';

const app = express();
const PORT = 3000;
const ZAMZAR_API_KEY = '88252b360b4695328fc121bbfae6da91787015bd';

app.use(cors());
app.use(fileUpload());

app.post('/convert', async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.files.file;

    const formData = new FormData();
    formData.append('source_file', file.data, file.name);
    formData.append('target_format', 'docx');

    try {
        const response = await fetch('https://sandbox.zamzar.com/v1/jobs', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(ZAMZAR_API_KEY + ':').toString('base64')
            },
            body: formData
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/job/:jobId', async (req, res) => {
    const { jobId } = req.params;

    try {
        const response = await fetch(`https://sandbox.zamzar.com/v1/jobs/${jobId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(ZAMZAR_API_KEY + ':').toString('base64')
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/file/:fileId', async (req, res) => {
    const { fileId } = req.params;

    try {
        const response = await fetch(`https://sandbox.zamzar.com/v1/files/${fileId}/content`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(ZAMZAR_API_KEY + ':').toString('base64')
            }
        });

        const buffer = await response.buffer();
        res.set('Content-Disposition', 'attachment; filename=converted.docx');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});