document.addEventListener('DOMContentLoaded', () => {
    const memoryForm = document.getElementById('memoryForm');
    const memoriesContainer = document.getElementById('memoriesContainer');
    let editingMemoryId = null;
    let currentMemories = []; // Add this to store current memories
    
    loadMemories();

    memoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = document.getElementById('message').value;
        const imageFile = document.getElementById('imageInput').files[0];
        
        if (!message.trim() && !imageFile) {
            alert('Please add a message or image');
            return;
        }

        const formData = new FormData();
        formData.append('message', message);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const url = editingMemoryId 
                ? `/api/memories/${editingMemoryId}`
                : '/api/memories';
            
            const method = editingMemoryId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: formData
            });

            if (response.ok) {
                memoryForm.reset();
                document.getElementById('submitBtn').textContent = 'Post Memory';
                editingMemoryId = null;
                loadMemories();
            } else {
                alert('Failed to save memory');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to save memory');
        }
    });

    async function loadMemories() {
        try {
            const response = await fetch('/api/memories');
            const memories = await response.json();
            currentMemories = memories; // Store the memories
            
            memoriesContainer.innerHTML = memories.map(memory => `
                <div class="memory-card" data-id="${memory.id}">
                    <div class="memory-actions">
                        <button class="edit-btn" onclick="editMemory('${memory.id}')">
                            <span class="btn-icon">✏️</span> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteMemory('${memory.id}')">
                            <span class="btn-icon">🗑️</span> Delete
                        </button>
                    </div>
                    <p class="memory-text">${memory.message}</p>
                    ${memory.imagePath ? `<img src="${memory.imagePath}" alt="Memory Image">` : ''}
                    <p class="memory-date">
                        ${new Date(memory.date).toLocaleString()}
                        ${memory.edited ? '<span class="edited-badge">(edited)</span>' : ''}
                    </p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading memories:', error);
        }
    }

    // Modify these functions to use currentMemories
    window.editMemory = (id) => {
        const memory = currentMemories.find(m => m.id === id);
        if (memory) {
            document.getElementById('message').value = memory.message;
            document.getElementById('submitBtn').textContent = 'Update Memory';
            editingMemoryId = id;
            document.getElementById('message').focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    window.deleteMemory = async (id) => {
        if (confirm('Are you sure you want to delete this memory?')) {
            try {
                const response = await fetch(`/api/memories/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    loadMemories();
                } else {
                    alert('Failed to delete memory');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to delete memory');
            }
        }
    };
});
