import sys
with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

endpoints = '''
// --- ADMIN USER MANAGEMENT ENDPOINTS ---

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        usersSnapshot.forEach(doc => {
            users.push({ uid: doc.id, ...doc.data() });
        });
        res.json({ users });
    } catch (error) {
        console.error('❌ Failed to get users:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users/update', verifyAdmin, async (req, res) => {
    try {
        const { uid, userRole, isAdmin, isPremium } = req.body;
        if (!uid) {
            return res.status(400).json({ error: 'Missing uid' });
        }
        
        const updateData = {};
        if (userRole !== undefined) updateData.userRole = userRole;
        if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
        if (isPremium !== undefined) {
            updateData.isPremium = isPremium;
            updateData['worldmodels.premium'] = isPremium;
        }

        console.log(👤 [ADMIN] Updating user :, updateData);
        await db.collection('users').doc(uid).update(updateData);
        
        // Also update in profiles if it exists
        const profileRef = db.collection('profiles').doc(uid);
        const profileDoc = await profileRef.get();
        if (profileDoc.exists) {
            await profileRef.update(updateData);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Failed to update user:', error.message);
        res.status(500).json({ error: error.message });
    }
});

'''

if '// --- ADMIN USER MANAGEMENT ENDPOINTS ---' not in content:
    content = content.replace('// --- IDENTITY & AUTH ENDPOINTS ---', endpoints + '// --- IDENTITY & AUTH ENDPOINTS ---')
    with open('server.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Endpoints added successfully.')
else:
    print('Endpoints already present.')
