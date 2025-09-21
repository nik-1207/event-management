const { v4: uuidv4 } = require('uuid');

/**
 * User model for the virtual event management platform
 */
class User {
  constructor({ email, password, firstName, lastName, role = 'attendee' }) {        this.id = uuidv4();
    this.email = email;
    this.password = password; // Will be hashed before storing
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role; // 'organizer' or 'attendee'
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isActive = true;
  }

  // Get full name
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Check if user is an organizer
  isOrganizer() {
    return this.role === 'organizer';
  }

  // Check if user is an attendee
  isAttendee() {
    return this.role === 'attendee';
  }

  // Update user information
  update(updates) {
    const allowedUpdates = ['firstName', 'lastName', 'email', 'role', 'isActive'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        this[key] = updates[key];
      }
    });
    this.updatedAt = new Date();
  }

  // Convert to JSON (excluding password)
  toJSON() {
    const userObject = { ...this };
    delete userObject.password;
    return userObject;
  }

  // Static method to validate user data
  static validate(userData) {
    const errors = [];

    if (!userData.email || typeof userData.email !== 'string') {
      errors.push('Email is required and must be a string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Email must be a valid email address');
    }

    if (!userData.password || typeof userData.password !== 'string') {
      errors.push('Password is required and must be a string');
    } else if (userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!userData.firstName || typeof userData.firstName !== 'string') {
      errors.push('First name is required and must be a string');
    }

    if (!userData.lastName || typeof userData.lastName !== 'string') {
      errors.push('Last name is required and must be a string');
    }

    if (userData.role && !['organizer', 'attendee'].includes(userData.role)) {
      errors.push('Role must be either "organizer" or "attendee"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = User;
