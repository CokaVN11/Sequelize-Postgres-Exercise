const sequelize = require('sequelize');
const models = require('../models');
const Op = sequelize.Op;

const middleware = async (req, res, next) => {
  // count how many blogs of each category
  res.locals.categories = await models.Category.findAll({
    attributes: ['name', [sequelize.fn('COUNT', sequelize.col('"Blogs"."id"')), 'blogCount']],
    include: [
      {
        model: models.Blog,
        attributes: []
      }
    ],
    group: ['Category.id']
  });
  // convert categories to array of objects
  res.locals.categories = res.locals.categories.map((category) => {
    return { name: category.name, blogCount: category.dataValues.blogCount };
  });
  next();
}

const showList = async (req, res) => {
  const title = req.query.title || '';
  let category = req.query.category || '';
  let tag = req.query.tag || '';
  category = category.replace('_', ' ');
  tag = tag.replace('_', ' ');

  let page = isNaN(req.query.page) ? 1 : Math.max(1, parseInt(req.query.page));
  console.log(page);
  const limit = 2;
  const offset = (page - 1) * limit;
  res.locals.blogs = await models.Blog.findAll({
    attributes: ['id', 'title', 'createdAt', 'imagePath', 'summary'],
    include: [
      {
        model: models.Comment,
        attributes: ['id']
      },
      {
        model: models.Category,
        attributes: ['name'],
      },
      {
        model: models.Tag,
        attributes: ['name'],
        unnest: true
      }
    ],
    where: {
      [Op.and]: [
        { title: { [Op.substring]: `${title}` } },
        { '$Category.name$': { [Op.iLike]: `%${category}%` } },
        { '$Tags.name$': { [Op.iLike]: `%${tag}%` } }

      ]
    },
    limit: limit,
    offset: offset,
  });

  res.render("index");
};

const showDetails = async (req, res) => {
  const id = isNaN(req.params.id) ? 0 : parseInt(req.params.id);
  res.locals.blog = await models.Blog.findOne({
    attributes: ['id', 'title', 'createdAt', 'description', 'imagePath', 'summary'],
    where: { id: id },
    include: [
      {model: models.User},
      {model: models.Tag},
      {model: models.Category},
      {model: models.Comment}
    ]
  })
  res.render("details");
}

module.exports = {
  middleware,
  showList,
  showDetails
}
