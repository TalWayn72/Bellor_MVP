/**
 * Socket Presence Methods
 * Presence-related WebSocket operations
 */

/**
 * Attach presence methods to a SocketService instance
 * @param {object} service - SocketService instance
 */
export function attachPresenceMethods(service) {
  /**
   * Check if users are online
   * @param {string[]} userIds
   * @returns {Promise<{success: boolean, data?: {onlineUsers: object}, error?: string}>}
   */
  service.checkUsersOnline = function (userIds) {
    return new Promise((resolve) => {
      this.emit('presence:check', { userIds }, (response) => {
        resolve(response);
      });
    });
  };

  /**
   * Get all online users
   * @returns {Promise<{success: boolean, data?: {onlineUsers: string[]}, error?: string}>}
   */
  service.getOnlineUsers = function () {
    return new Promise((resolve) => {
      this.emit('presence:get-online', null, (response) => {
        resolve(response);
      });
    });
  };

  /**
   * Send heartbeat to maintain presence
   */
  service.sendHeartbeat = function () {
    this.emit('presence:heartbeat', { timestamp: new Date().toISOString() }, () => {});
  };

  /**
   * Update activity status
   * @param {string} activity - 'active', 'away', 'busy'
   */
  service.updateActivity = function (activity) {
    this.emit('presence:activity', { activity }, () => {});
  };
}
