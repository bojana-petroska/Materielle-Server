const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const Material = require("../models/Material.model");
const ChatMessage = require('../models/ChatMessage.model')

const router = express.Router();
const saltRounds = 10;

const fileUploader = require('../config/cloudinary.config');
const cloudinary = require('../config/cloudinary.config');


const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// POST /auth/signup  - Creates a new user in the database
router.post('/signup', (req, res, next) => {
    const { email, password, username, agreeToTerms, userType, company, iAmInterestedIn } = req.body;
    console.log(agreeToTerms)
  
    // Check if the email or password or name is provided as an empty string 
    if (email === '' || password === '' || username === '') {
      res.status(400).json({ message: "Please provide email, password and name" });
      return;
    }
  
    // Use regex to validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Please provide a valid email address.' });
      return;
    }
    
    // Use regex to validate the password format
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({ message: 'Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.' });
      return;
    }

    // Check if the agree to terms button is clicked(true)
    if (!agreeToTerms) {
        res.status(400).json({ message: 'Agree to our terms in order to create a profile.' });
        return;
    }
  
  
    // Check the users collection if a user with the same email already exists
    User.findOne({ email })
      .then((foundUser) => {
        // If the user with the same email already exists, send an error response
        if (foundUser) {
          res.status(400).json({ message: "User already exists." });
          return;
        }
  
        // If the email is unique, proceed to hash the password
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(password, salt);

        console.log(iAmInterestedIn)
  
        // Create a new user in the database
        // We return a pending promise, which allows us to chain another `then` 
        return User.create({ email, password: hashedPassword, username, agreeToTerms, userType, company, interest: iAmInterestedIn });
      })
      .then((createdUser) => {
        // Deconstruct the newly created user object to omit the password
        // We should never expose passwords publicly
        const { email, name, _id, userType, agreeToTerms, company, iAmInterestedIn } = createdUser;
      
        // Create a new object that doesn't expose the password
        const user = { email, name, _id, userType, agreeToTerms, company, iAmInterestedIn };
  
        // Send a json response containing the user object
        res.status(201).json({ user: user });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" })
      });
  });

// POST  /auth/login - Verifies email and password and returns a JWT
router.post('/login', (req, res, next) => {
    const { email, password } = req.body;
  
    // Check if email or password are provided as empty string 
    if (email === '' || password === '') {
      res.status(400).json({ message: "Please provide email and password." });
      return;
    }
  
    // Check the users collection if a user with the same email exists
    User.findOne({ email })
      .then((foundUser) => {
      
        if (!foundUser) {
          // If the user is not found, send an error response
          res.status(401).json({ message: "User not found." })
          return;
        }
  
        // Compare the provided password with the one saved in the database
        const passwordCorrect = bcrypt.compareSync(password, foundUser.password);
  
        if (passwordCorrect) {
          // Deconstruct the user object to omit the password
          const { _id, email, username } = foundUser;
          
          // Create an object that will be set as the token payload
          const payload = { _id, email, username };
  
          // Create and sign the token
          const authToken = jwt.sign( 
            payload,
            process.env.TOKEN_SECRET,
            { algorithm: 'HS256', expiresIn: "6h" }
          );
  
          // Send the token as the response
          res.status(200).json({ authToken: authToken });
        }
        else {
          res.status(401).json({ message: "Unable to authenticate the user" });
        }
  
      })
      .catch(err => res.status(500).json({ message: "Internal Server Error" }));
  });
  
  // GET  /auth/verify
  router.get('/verify', isAuthenticated, (req, res, next) => {       // <== CREATE NEW ROUTE
 
    // If JWT token is valid the payload gets decoded by the
    // isAuthenticated middleware and made available on `req.payload`
    console.log(`req.payload`, req.payload);
   
    // Send back the object with user data
    // previously set as the token payload
    res.status(200).json(req.payload);
  });

  //get the profile username info
  router.get('/profile', isAuthenticated, (req, res) => {

    const userId = req.payload._id

    User.findById(userId)
    .populate({
      path: "wishList",
      model: "Material"
    })
    .then((foundUser) => {
      if(!foundUser) {
        res.status(404).json({ message: "User not found." })
        return
      }

      const { _id, email, username, userType, company, interest, wishList } = foundUser;

      const profile = { _id, email, username, userType, company, interest, wishList  }

      res.status(200).json({ profile })

    })
    .catch(err => res.status(500).json({ message: "Internal Server Error" }))

  })

  router.put('/profile', isAuthenticated, (req, res) => {
    const userId = req.payload._id
    const { wishList } = req.body

    User.findByIdAndUpdate(userId, { wishList }, { new:true })
    .then(updatedUser => {
      console.log(updatedUser)
      if(!updatedUser) {
        res.status(404).json({ message: 'User not found.' })
        return
      }
      res.status(200).json({ message: 'Profile updated successfully.' });
    })
    .catch(err => res.status(500).json({ message:'Internal Server Error' }))
  })

  router.post('/wishlist/add', isAuthenticated, (req, res) => {
    console.log(req.payload)
    const userId = req.payload._id
    console.log("route called", userId)
    const materialId = req.body.materialId
    console.log(materialId)

    User.findByIdAndUpdate(userId, { $push: 
      {wishList: materialId}}, { new:true }
    ) 
    .then(updatedUser => {
      console.log(updatedUser)
      if(!updatedUser) {
        res.status(404).json({ message: 'User not found.' })
        return
      }
      res.status(200).json({ message: 'Material added successfully.' });
    })
    .catch(err => res.status(500).json({ message:'Internal Server Error' }))

  })

// router.post('/upload-photo', fileUploader.single('') (req, res) => {

//   // const { photo } = req.body;

//   // Upload the file to Cloudinary
//   // cloudinary.uploader.upload(file.tempFilePath, (err, result) => {
//   //   if (err) {
//   //     console.log(err);
//   //     res.status(500).json({ message: "Failed to upload photo" });
//   //   } else {
//   //     // The photo has been uploaded successfully
//   //     // You can save the result.url or result.public_id in your user model

//   //     res.status(200).json({ imageUrl: result.url });
//   //   }
//   // });

// });


router.get('/search', (req, res) => {

  const { query, sortBy } = req.query;

  let sortOptions = {};

  if (sortBy === 'name') {
    sortOptions = { name: 1 }; 
  } else if (sortBy === 'price') {
    sortOptions = { price: 1 }; 
  }

  Material.find({ name: { $regex: query, $options: 'i' } })
    .sort(sortOptions)
    .then((searchResults) => {
      res.json(searchResults);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: 'An error occurred' });
    });
});


router.delete('/wishlist/remove/:materialId', isAuthenticated, (req, res) => {
  const materialId = req.params.materialId
  console.log(materialId)
  const userId = req.payload._id
  console.log('HIIIIIIIIIIIIII', userId)

  User.findByIdAndUpdate(userId,
    { $pull: { wishList: materialId } },
    { new: true })
    .then((user) => {
      res.json({ wishList: user.wishList })
    })
    .catch((err) => {
      console.log(err)
      res.status(500).json({ message: 'Failed to remove item.' })
    })

})

router.get('/parquet', (req, res) => {
  console.log('HIIIIIII')
})

router.get('/edit', (req, res) => {
  console.log('HIIIIIII')
})

router.post('/getProsAndCons', (req, res) => {
  const materialId = req.params.materialId

  const prompt = `Give me the pros and cons for ${materialId}`;

  const newMessage = new ChatMessage({
    role: 'user',
    content: prompt
  })

  newMessage.save()
  .then(() => {
    const botMessage = new ChatMessage({
      role: 'bot',
      content: chatResponse
    })

    botMessage.save()
    .then(() => {
      res.json({ message: chatResponse })
    })
    .catch((err) => {
      console.log(err)
      res.status(500).json({ err: 'Something went wrong.' })
    })
    .catch((err) => {
      console.log(err)
      res.status(500).json({ err: 'Something went wrong.' })
    })
  })
});

  
module.exports = router;



