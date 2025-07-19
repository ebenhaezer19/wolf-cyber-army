const { Category } = require('../models');
const logUserAction = require('../utils/logUserAction');

// Create Category (admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    const category = await Category.create({ name, description });
    await logUserAction(req.user.id, `Created category: ${name}`);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category.', error: err.message });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories.', error: err.message });
  }
};

// Update Category (admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    // Find category
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    // Update category
    await category.update({ name, description });
    await logUserAction(req.user.id, `Updated category: ${category.name} to ${name}`);
    
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category.', error: err.message });
  }
};

// Delete Category (admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find category
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    // Store category name before deletion for logging
    const categoryName = category.name;

    // Delete category
    await category.destroy();
    await logUserAction(req.user.id, `Deleted category: ${categoryName}`);
    
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category.', error: err.message });
  }
};
