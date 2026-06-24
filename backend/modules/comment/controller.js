const { successResponse, errorResponse } = require("../../utils/response");
const Comment = require("./model");

const toCommentDTO = (row) => ({
  id: row.id,
  body: row.body,
  authorName: row.authorName || "Staff",
  createdAt: row.createdAt || new Date(),
});

const createCommentHandlers = ({ resolveParent, foreignKey, entityName }) => {
  const listComments = async (req, res) => {
    try {
      const { shop, parent, error } = await resolveParent(req);
      if (error) return errorResponse(res, ...error);

      const comments = await Comment.findAll({
        where: { shopId: shop.id, [foreignKey]: parent.id },
        order: [["createdAt", "DESC"]],
      });

      successResponse(res, 200, "Comments fetched successfully", {
        comments: comments.map(toCommentDTO),
      });
    } catch (err) {
      console.error(`Error listing comments for ${entityName}:`, err.message);
      const status = err.statusCode || 500;
      errorResponse(res, status, err.message || `Failed to load comments`, err);
    }
  };

  const createComment = async (req, res) => {
    try {
      const { shop, parent, error } = await resolveParent(req);
      if (error) return errorResponse(res, ...error);

      const body = String(req.body?.body ?? "").trim();
      if (!body) return errorResponse(res, 400, "Comment can't be empty");

      const comment = await Comment.create({
        shopId: shop.id,
        [foreignKey]: parent.id,
        authorName: shop.shopOwner || shop.name || "Staff",
        body,
      });

      successResponse(res, 201, "Comment added", toCommentDTO(comment));
    } catch (err) {
      console.error(`Error creating comment for ${entityName}:`, err.message);
      const status = err.statusCode || 500;
      errorResponse(res, status, err.message || `Failed to add comment`, err);
    }
  };

  const deleteComment = async (req, res) => {
    try {
      const { shop, parent, error } = await resolveParent(req);
      if (error) return errorResponse(res, ...error);

      const commentId = parseInt(req.params.commentId, 10);
      if (!Number.isInteger(commentId) || commentId < 1) {
        return errorResponse(res, 400, "Invalid comment id");
      }

      const deleted = await Comment.destroy({
        where: { id: commentId, shopId: shop.id, [foreignKey]: parent.id },
      });
      if (!deleted) return errorResponse(res, 404, "Comment not found");

      successResponse(res, 200, "Comment deleted", { id: commentId });
    } catch (err) {
      console.error(`Error deleting comment for ${entityName}:`, err.message);
      const status = err.statusCode || 500;
      errorResponse(
        res,
        status,
        err.message || `Failed to delete comment`,
        err
      );
    }
  };

  return { listComments, createComment, deleteComment };
};

module.exports = {
  createCommentHandlers,
  toCommentDTO,
};
