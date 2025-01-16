const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const sharp = require('sharp');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Configure multer for handling file uploads
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

// In-memory storage for memories (replace with a database in production)
let memories = [];

// Create uploads directory if it doesn't exist
if (!fs.existsSync('public/uploads')) {
    fs.mkdirSync('public/uploads', { recursive: true });
}

// Routes
app.post('/api/memories', upload.single('image'), async (req, res) => {
    try {
        let imagePath = null;
        
        if (req.file) {
            const filename = Date.now() + '.jpg';
            imagePath = `/uploads/${filename}`;
            
            await sharp(req.file.buffer)
                .resize(300, 300, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toFile(`public/uploads/${filename}`);
        }

        const memory = {
            id: Date.now().toString(), 
            message: req.body.message,
            imagePath: imagePath,
            date: new Date()
        };
        
        memories.unshift(memory);
        res.status(201).json(memory);
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

app.put('/api/memories/:id', upload.single('image'), async (req, res) => {
    try {
        const memoryIndex = memories.findIndex(m => m.id === req.params.id);
        if (memoryIndex === -1) {
            return res.status(404).json({ error: 'Memory not found' });
        }

        let imagePath = memories[memoryIndex].imagePath;
        
        if (req.file) {
            if (imagePath) {
                const oldImagePath = `public${imagePath}`;
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            const filename = Date.now() + '.jpg';
            imagePath = `/uploads/${filename}`;
            
            await sharp(req.file.buffer)
                .resize(300, 300, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toFile(`public/uploads/${filename}`);
        }

        memories[memoryIndex] = {
            ...memories[memoryIndex],
            message: req.body.message || memories[memoryIndex].message,
            imagePath: imagePath,
            edited: true
        };

        res.json(memories[memoryIndex]);
    } catch (error) {
        console.error('Error updating memory:', error);
        res.status(500).json({ error: 'Failed to update memory' });
    }
});

app.delete('/api/memories/:id', (req, res) => {
    const memoryIndex = memories.findIndex(m => m.id === req.params.id);
    if (memoryIndex === -1) {
        return res.status(404).json({ error: 'Memory not found' });
    }

    if (memories[memoryIndex].imagePath) {
        const imagePath = `public${memories[memoryIndex].imagePath}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    memories.splice(memoryIndex, 1);
    res.json({ message: 'Memory deleted successfully' });
});

app.get('/api/memories', (req, res) => {
    res.json(memories);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
