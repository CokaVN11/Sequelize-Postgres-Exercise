const sequelize = require('sequelize');
const models = require('../models');
const Op = sequelize.Op;

const middleware = async (req, res, next) => {
  // count how many blogs of each category
  res.locals.categories = await models.Category.findAll({
    attributes: ['id', 'name', [sequelize.fn('COUNT', sequelize.col('"Blogs"."id"')), 'blogCount']],
    include: [
      {
        model: models.Blog,
        attributes: []
      }
    ],
    group: ['Category.id']
  });
  res.locals.tags = await models.Tag.findAll({
    attributes: ['id', 'name'],
  });

  // convert categories to array of objects
  res.locals.categories = res.locals.categories.map((category) => {
    return { id: category.id, name: category.name, blogCount: category.dataValues.blogCount };
  });
  next();
}

const showList = async (req, res) => {
  const keyword = req.query.keyword || '';
  let category = isNaN(req.query.category) ? 0 : parseInt(req.query.category);
  let tag = isNaN(req.query.tag) ? 0 : parseInt(req.query.tag);
  let page = isNaN(req.query.page) ? 1 : Math.max(1, parseInt(req.query.page));

  const limit = 4;

  let options = {
    attributes: ['id', 'title', 'createdAt', 'imagePath', 'summary',
      [sequelize.literal('(SELECT COUNT(*) FROM "Comments" WHERE "Comments"."blogId" = "Blog"."id")'), 'commentCount']
    ],
    where: {}
  };
  if (category > 0) {
    options.where.categoryId = category;
  }
  if (tag > 0) {
    options.include = [
      {
        model: models.Tag,
        attributes: [],
        where: { id: tag }
      }
    ]
  }

  if (keyword.trim() != '') {
    options.where.title = { [Op.iLike]: `%${keyword}%` };
  }
  options.limit = limit;
  options.offset = (page - 1) * limit;
  let { rows, count } = await models.Blog.findAndCountAll(options);
  res.locals.pagination = {
    page: page,
    limit: limit,
    totalRows: count,
    queryParams: req.query
  };

  res.locals.blogs = rows;
  res.locals.blogs.forEach(e => {
    e.commentCount = e.dataValues.commentCount;
  });
  res.render("index");
};

const showDetails = async (req, res) => {
  const id = isNaN(req.params.id) ? 0 : parseInt(req.params.id);
  res.locals.blog = await models.Blog.findOne({
    attributes: ['id', 'title', 'createdAt', 'description', 'imagePath', 'summary'],
    where: { id: id },
    include: [
      { model: models.User },
      { model: models.Tag },
      { model: models.Category },
      { model: models.Comment }
    ]
  })

  res.locals.blog.User.role = res.locals.blog.User.isAdmin ? 'Admin' : 'User';
  res.render("details");
}

module.exports = {
  middleware,
  showList,
  showDetails
}
