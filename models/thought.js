const mongoose = require('mongoose');

const thoughtSchema = new mongoose.Schema({
  // Reference to the User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A thought must belong to a user']
  },
  
  // The actual intrusive thought
  content: {
    type: String,
    required: [true, 'Type your intrusive thought!'],
    trim: true,
    maxlength: [1000, 'Keep your intrusive thoughts under 1000 characters']
  },
  
  // The future date/time 
  worryTime: {
    type: Date,
    required: [true, 'Please schedule a time to worry about this later'],
    validate: {
      validator: function(value) {
        // Validation: The scheduled time must be in the future
        return value > new Date();
      },
      message: 'You cannot schedule a worry time in the past!'
    }
  },
  
  // Tracks notification dispatch status
  isNotified: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true // Automatically creates createdAt and updatedAt fields
});

// Indexing worryTime and isNotified together to make the background job search hyper-efficient
thoughtSchema.index({ worryTime: 1, isNotified: 1 });

module.exports = mongoose.model('Thought', thoughtSchema);