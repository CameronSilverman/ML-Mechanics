const express = require('express');
const router = express.Router();
const {users} = require('../models');


//POST
router.post('/add-email', async (req, res)=>{
    
    const {email} = req.body;
    
    try {
        // Check if the email already exists in the database
        const existingUser = await users.findOne({ where: { email } });
    
        if (existingUser) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        // Create a new user record
        const newUser = await users.create({ email });
        return res.status(201).json(newUser);
    } catch (error) {
        console.error('Error adding email:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

//GET
router.get('/get-email', async (req, res)=>{

    const {email} = req.body;

    try {
        // Check if the email already exists in the database
        const existingUser = await users.findOne({ where: { email } });
        //Echo email if it exists
        if (existingUser) {
            return res.json(existingUser);
        } else {
            return res.status(404).json({ error: 'Email not found' });
        }
    } catch (error) {
        console.error('Error finding email:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/get-all-emails', async (req, res)=>{
    try {
        //Get list of all emails in database
        const emailList = await users.findAll();
        //Echo email if it exists
        if (emailList) {
            return res.json(emailList);
        } else {
            return res.status(404).json({ error: 'Emails not found' });
        }
    } catch (error) {
        console.error('Error finding email:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

//DELETE
router.delete('/remove-email', async (req, res) => {
    const { email } = req.body;
  
    try {
      // Find and delete the user record
      const deletedUser = await users.destroy({ where: { email } });
  
      if (deletedUser) {
        return res.status(200).json({ message: 'Email removed successfully' });
      } else {
        return res.status(404).json({ error: 'Email not found' });
      }
    } catch (error) {
      console.error('Error removing email:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = router;