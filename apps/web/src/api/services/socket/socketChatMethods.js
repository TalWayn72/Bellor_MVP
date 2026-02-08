/**
 * Socket Chat Methods
 * Chat-related WebSocket operations
 */

/**
 * Attach chat methods to a SocketService instance
 * @param {object} service - SocketService instance
 */
export function attachChatMethods(service) {
  /**
   * Join a chat room
   * @param {string} chatId
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  service.joinChat = function (chatId) {
    return new Promise((resolve) => {
      this.emit('chat:join', { chatId }, (response) => {
        resolve(response);
      });
    });
  };

  /**
   * Leave a chat room
   * @param {string} chatId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  service.leaveChat = function (chatId) {
    return new Promise((resolve) => {
      this.emit('chat:leave', { chatId }, (response) => {
        resolve(response);
      });
    });
  };

  /**
   * Send a message via WebSocket
   * @param {string} chatId
   * @param {string} content
   * @param {object} metadata
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  service.sendMessage = function (chatId, content, metadata = {}) {
    return new Promise((resolve) => {
      this.emit('chat:message', { chatId, content, metadata }, (response) => {
        resolve(response);
      });
    });
  };

  /**
   * Send typing indicator
   * @param {string} chatId
   * @param {boolean} isTyping
   */
  service.sendTyping = function (chatId, isTyping) {
    this.emit('chat:typing', { chatId, isTyping }, () => {});
  };

  /**
   * Mark message as read
   * @param {string} messageId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  service.markMessageRead = function (messageId) {
    return new Promise((resolve) => {
      this.emit('chat:message:read', { messageId }, (response) => {
        resolve(response);
      });
    });
  };

  /**
   * Delete a message
   * @param {string} messageId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  service.deleteMessage = function (messageId) {
    return new Promise((resolve) => {
      this.emit('chat:message:delete', { messageId }, (response) => {
        resolve(response);
      });
    });
  };

  /**
   * Get unread message count
   * @returns {Promise<{success: boolean, data?: {unreadCount: number}, error?: string}>}
   */
  service.getUnreadCount = function () {
    return new Promise((resolve) => {
      this.emit('chat:unread:count', null, (response) => {
        resolve(response);
      });
    });
  };
}
