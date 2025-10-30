// utils/activityHelper.js
const User = require('../models/User');

const getTodayISO = () => new Date().toISOString().split('T')[0];

async function logUserActivity(userId) {
  try {
    const date = getTodayISO();

    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for activity logging.`);
      return;
    }

    if (!user.activity) user.activity = [];

    if (!user.activity.includes(date)) {
      user.activity.push(date);
      await user.save();
      console.log(`✅ Activity logged for ${user.email} on ${date}`);
    } else {
      console.log(`ℹ️ Activity already exists for ${user.email} on ${date}`);
    }

    return user.activity;
  } catch (err) {
    console.error('❌ Error logging user activity:', err.message);
  }
}

module.exports = { logUserActivity };
