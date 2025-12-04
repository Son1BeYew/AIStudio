const express = require("express");
const router = express.Router();
const {
  getAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
} = require("../controllers/promptController");

/**
 * @swagger
 * /prompts:
 *   get:
 *     summary: Get all prompts
 *     tags: [Prompts]
 *     parameters:
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, unisex]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of prompts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prompt'
 *   post:
 *     summary: Create a new prompt
 *     tags: [Prompts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - prompt
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               prompt:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, unisex]
 *               isActive:
 *                 type: boolean
 *               image:
 *                 type: string
 *               fee:
 *                 type: number
 *     responses:
 *       201:
 *         description: Prompt created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prompt'
 */
router.get("/", getAllPrompts);
router.post("/", createPrompt);

/**
 * @swagger
 * /prompts/{id}:
 *   put:
 *     summary: Update a prompt
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prompt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               prompt:
 *                 type: string
 *               gender:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               fee:
 *                 type: number
 *     responses:
 *       200:
 *         description: Prompt updated
 *       404:
 *         description: Prompt not found
 *   delete:
 *     summary: Delete a prompt
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prompt ID
 *     responses:
 *       200:
 *         description: Prompt deleted
 *       404:
 *         description: Prompt not found
 */
router.put("/:id", updatePrompt);
router.delete("/:id", deletePrompt);

module.exports = router;
