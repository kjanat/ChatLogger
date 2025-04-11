const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticateJWT, authenticateApiKey } = require('../middleware/auth');
const { addOrganizationToRequest } = require('../middleware/organization-auth');
const { validate, validateQuery, validateObjectId, chatSchemas } = require('../middleware/validation');

// Authentication middleware - accept either JWT or API Key
const auth = [
    (req, res, next) => {
        authenticateJWT(req, res, (err) => {
            if (!err) return next();
            authenticateApiKey(req, res, next);
        });
    }
];

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat session management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       required:
 *         - userId
 *         - organizationId
 *         - title
 *         - source
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated chat ID
 *         userId:
 *           type: string
 *           description: User who created the chat
 *         organizationId:
 *           type: string
 *           description: Organization the chat belongs to
 *         title:
 *           type: string
 *           description: Chat title/subject
 *         source:
 *           type: string
 *           enum: [web, mobile, api]
 *           description: Source of the chat
 *         metadata:
 *           type: object
 *           description: Additional data about the chat
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorizing the chat
 *         isActive:
 *           type: boolean
 *           description: Whether the chat is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the chat was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the chat was last updated
 *       example:
 *         _id: 60d21b4667d0d8992e610c85
 *         userId: 60d21b4667d0d8992e610c84
 *         organizationId: 60d21b4667d0d8992e610c83
 *         title: Password Reset Help
 *         source: web
 *         metadata: { browser: "Chrome", os: "Windows" }
 *         tags: [support, password]
 *         isActive: true
 *         createdAt: 2023-04-11T10:00:00Z
 *         updatedAt: 2023-04-11T10:05:00Z
 */

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: Create a new chat session
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Chat title/subject
 *               source:
 *                 type: string
 *                 enum: [web, mobile, api]
 *                 default: web
 *                 description: Source of the chat
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags for categorizing the chat
 *               metadata:
 *                 type: object
 *                 description: Additional data about the chat
 *     responses:
 *       201:
 *         description: Chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 chat:
 *                   $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Invalid input or missing organization context
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, addOrganizationToRequest, validate(chatSchemas.create), chatController.createChat);

/**
 * @swagger
 * /chats:
 *   get:
 *     summary: Get all chats for current user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of chats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chat'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalChats:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, addOrganizationToRequest, validateQuery(chatSchemas.pagination), chatController.getUserChats);

/**
 * @swagger
 * /chats/search:
 *   get:
 *     summary: Search chats by title or tags
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chat'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalChats:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/search', auth, addOrganizationToRequest, validateQuery(chatSchemas.search), chatController.searchChats);

/**
 * @swagger
 * /chats/{chatId}:
 *   get:
 *     summary: Get a specific chat by ID
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.get('/:chatId', auth, validateObjectId('chatId'), addOrganizationToRequest, chatController.getChatById);

/**
 * @swagger
 * /chats/{chatId}:
 *   put:
 *     summary: Update chat details
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Chat title/subject
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags for categorizing the chat
 *               metadata:
 *                 type: object
 *                 description: Additional data about the chat
 *               isActive:
 *                 type: boolean
 *                 description: Whether the chat is active
 *     responses:
 *       200:
 *         description: Chat updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 chat:
 *                   $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.put('/:chatId', auth, validateObjectId('chatId'), addOrganizationToRequest, validate(chatSchemas.update), chatController.updateChat);

/**
 * @swagger
 * /chats/{chatId}:
 *   delete:
 *     summary: Delete a chat and its messages
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.delete('/:chatId', auth, validateObjectId('chatId'), addOrganizationToRequest, chatController.deleteChat);

module.exports = router;
