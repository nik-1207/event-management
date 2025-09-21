const nodemailer = require('nodemailer');

/**
 * Email utility for sending notifications
 */
class EmailUtils {  constructor() {
    // Configure email transporter using Ethereal Email
    this.transporter = nodemailer.createTransport({
      host: 'ethereal.risebuildings.com',
      port: 5587,
      auth: {
        user: 'carson.pacocha35@ethereal.risebuildings.com',
        pass: 'hnxFnXuaDERDmHe3cD'
      }
    });

    console.log('✅ Using Ethereal Email for email delivery');
    console.log('📧 Ethereal Email URL: https://ethereal.email/login');
    console.log('📧 Username: carson.pacocha35@ethereal.risebuildings.com');
  }
  /**
   * Send welcome email to new user
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Email send result
   */
  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@eventmanagement.com',
      to: user.email,
      subject: 'Welcome to Virtual Event Management Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Virtual Event Management Platform!</h2>
          <p>Dear ${user.getFullName()},</p>
          <p>Thank you for registering with our Virtual Event Management Platform. Your account has been successfully created.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Account Details:</h3>
            <p><strong>Name:</strong> ${user.getFullName()}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <p><strong>Account Created:</strong> ${user.createdAt.toLocaleDateString()}</p>
          </div>
          <p>You can now:</p>
          <ul>
            <li>Browse and register for upcoming events</li>
            <li>Manage your event registrations</li>
            ${user.isOrganizer() ? '<li>Create and manage your own events</li>' : ''}
          </ul>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Event Management Team</p>
        </div>
      `
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Send event registration confirmation email
   * @param {Object} user - User object
   * @param {Object} event - Event object
   * @returns {Promise<Object>} - Email send result
   */
  async sendEventRegistrationEmail(user, event) {
    const eventDateTime = event.getDateTime();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@eventmanagement.com',
      to: user.email,
      subject: `Event Registration Confirmed: ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Event Registration Confirmed!</h2>
          <p>Dear ${user.getFullName()},</p>
          <p>You have successfully registered for the following event:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${event.title}</h3>
            <p><strong>Description:</strong> ${event.description}</p>
            <p><strong>Date:</strong> ${eventDateTime.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Duration:</strong> ${event.duration} minutes</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Category:</strong> ${event.category}</p>
          </div>
          <p>Please save this information and make sure to attend the event on time.</p>
          <p>If you need to cancel your registration, please contact us as soon as possible.</p>
          <p>Best regards,<br>The Event Management Team</p>
        </div>
      `
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Send event creation notification to organizer
   * @param {Object} organizer - Organizer user object
   * @param {Object} event - Event object
   * @returns {Promise<Object>} - Email send result
   */
  async sendEventCreationEmail(organizer, event) {
    const eventDateTime = event.getDateTime();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@eventmanagement.com',
      to: organizer.email,
      subject: `Event Created Successfully: ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2196F3;">Event Created Successfully!</h2>
          <p>Dear ${organizer.getFullName()},</p>
          <p>Your event has been created successfully and is now available for registration:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${event.title}</h3>
            <p><strong>Event ID:</strong> ${event.id}</p>
            <p><strong>Description:</strong> ${event.description}</p>
            <p><strong>Date:</strong> ${eventDateTime.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Duration:</strong> ${event.duration} minutes</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Max Participants:</strong> ${event.maxParticipants || 'Unlimited'}</p>
            <p><strong>Status:</strong> ${event.isPublic ? 'Public' : 'Private'}</p>
          </div>
          <p>You can now manage your event and track registrations through your organizer dashboard.</p>
          <p>Best regards,<br>The Event Management Team</p>
        </div>
      `
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Send event reminder email
   * @param {Object} user - User object
   * @param {Object} event - Event object
   * @returns {Promise<Object>} - Email send result
   */
  async sendEventReminderEmail(user, event) {
    const eventDateTime = event.getDateTime();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@eventmanagement.com',
      to: user.email,
      subject: `Event Reminder: ${event.title} - Tomorrow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF9800;">Event Reminder</h2>
          <p>Dear ${user.getFullName()},</p>
          <p>This is a friendly reminder that you have an event tomorrow:</p>
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF9800;">
            <h3 style="margin-top: 0; color: #333;">${event.title}</h3>
            <p><strong>Date:</strong> ${eventDateTime.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Location:</strong> ${event.location}</p>
          </div>
          <p>Please make sure to arrive on time. We look forward to seeing you there!</p>
          <p>Best regards,<br>The Event Management Team</p>
        </div>
      `
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Send generic email
   * @param {Object} mailOptions - Email options
   * @returns {Promise<Object>} - Email send result
   */
  async sendEmail(mailOptions) {
    try {
      const result = await this.transporter.sendMail(mailOptions);
      
      // Log preview URL for development (but not during tests)
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(result));
      }
      
      return {
        success: true,
        messageId: result.messageId,
        previewUrl: nodemailer.getTestMessageUrl(result)
      };
    } catch (error) {
      // Only log errors if not in test environment
      if (process.env.NODE_ENV !== 'test') {
        console.error('Email sending failed:', error);
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify email transporter configuration
   * @returns {Promise<boolean>} - True if configuration is valid
   */
  async verifyTransporter() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      // Only log errors if not in test environment
      if (process.env.NODE_ENV !== 'test') {
        console.error('Email transporter verification failed:', error);
      }
      return false;
    }
  }
}

// Create a singleton instance
const emailUtils = new EmailUtils();

module.exports = emailUtils;
