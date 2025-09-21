const uuid = require('uuid');

/**
 * Event model for the virtual event management platform
 */
class Event {
  constructor({ 
    title, 
    description, 
    date, 
    time, 
    duration = 60, // in minutes
    location, 
    maxParticipants = null, 
    organizerId,
    category = 'General',
    isPublic = true 
  }) {
    this.id = uuid.v4();
    this.title = title;
    this.description = description;
    this.date = new Date(date);
    this.time = time;
    this.duration = duration;
    this.location = location;
    this.maxParticipants = maxParticipants;
    this.organizerId = organizerId;
    this.category = category;
    this.isPublic = isPublic;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isActive = true;
    this.status = 'upcoming'; // 'upcoming', 'ongoing', 'completed', 'cancelled'
  }

  // Get event date and time as a combined Date object
  getDateTime() {
    const [hours, minutes] = this.time.split(':').map(Number);
    const eventDateTime = new Date(this.date);
    eventDateTime.setHours(hours, minutes, 0, 0);
    return eventDateTime;
  }

  // Check if event has started
  hasStarted() {
    return new Date() >= this.getDateTime();
  }

  // Check if event has ended
  hasEnded() {
    const endTime = new Date(this.getDateTime());
    endTime.setMinutes(endTime.getMinutes() + this.duration);
    return new Date() > endTime;
  }

  // Update event status based on current time
  updateStatus() {
    const now = new Date();
    const startTime = this.getDateTime();
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + this.duration);

    if (this.status === 'cancelled') {
      return this.status;
    }

    if (now < startTime) {
      this.status = 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      this.status = 'ongoing';
    } else {
      this.status = 'completed';
    }

    return this.status;
  }

  // Check if event is full
  isFull(currentParticipants = 0) {
    return this.maxParticipants !== null && currentParticipants >= this.maxParticipants;
  }

  // Update event information
  update(updates) {
    const allowedUpdates = [
      'title', 'description', 'date', 'time', 'duration', 
      'location', 'maxParticipants', 'category', 'isPublic', 'status'
    ];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'date') {
          this[key] = new Date(updates[key]);
        } else {
          this[key] = updates[key];
        }
      }
    });
    this.updatedAt = new Date();
  }

  // Convert to JSON
  toJSON() {
    return {
      ...this,
      date: this.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
    };
  }

  // Static method to validate event data
  static validate(eventData) {
    const errors = [];

    if (!eventData.title || typeof eventData.title !== 'string') {
      errors.push('Title is required and must be a string');
    }

    if (!eventData.description || typeof eventData.description !== 'string') {
      errors.push('Description is required and must be a string');
    }

    if (!eventData.date) {
      errors.push('Date is required');
    } else {
      const eventDate = new Date(eventData.date);
      if (isNaN(eventDate.getTime())) {
        errors.push('Date must be a valid date');
      } else if (eventDate < new Date().setHours(0, 0, 0, 0)) {
        errors.push('Event date cannot be in the past');
      }
    }

    if (!eventData.time || typeof eventData.time !== 'string') {
      errors.push('Time is required and must be a string');
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(eventData.time)) {
      errors.push('Time must be in HH:MM format');
    }

    if (eventData.duration && (typeof eventData.duration !== 'number' || eventData.duration <= 0)) {
      errors.push('Duration must be a positive number (in minutes)');
    }

    if (!eventData.location || typeof eventData.location !== 'string') {
      errors.push('Location is required and must be a string');
    }

    if (eventData.maxParticipants && (typeof eventData.maxParticipants !== 'number' || eventData.maxParticipants <= 0)) {
      errors.push('Max participants must be a positive number');
    }

    if (!eventData.organizerId || typeof eventData.organizerId !== 'string') {
      errors.push('Organizer ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Static method to get upcoming events
  static filterUpcoming(events) {
    return events.filter(event => {
      event.updateStatus();
      return event.status === 'upcoming' && event.isActive;
    });
  }

  // Static method to get ongoing events
  static filterOngoing(events) {
    return events.filter(event => {
      event.updateStatus();
      return event.status === 'ongoing' && event.isActive;
    });
  }

  // Static method to get completed events
  static filterCompleted(events) {
    return events.filter(event => {
      event.updateStatus();
      return event.status === 'completed' && event.isActive;
    });
  }
}

module.exports = Event;
