const express = require('express');
const db = require('../db');


const qaRouter = express.Router();

qaRouter.get('/questions/:product_id', async (req, res) => {
  // add functionality to account for headers on count and page
  const query = await db.query(`
  SELECT
  JSON_BUILD_OBJECT(
    'question_id', question.id,
    'question_body', question.body,
    'asker_name', question.asker_name,
    'question_helpfulness', question.helpful,
    'question_date', question.date_written,
    'reported', question.reported,
    'answers',
    JSON_OBJECT_AGG(
      answer.id,
      JSON_BUILD_OBJECT(
        'answerid', answer.id,
        'body', answer.body,
        'date', answer.date_written,
        'answerer_name', answer.answerer_name,
        'helpfulness', answer.helpful,
        'reported', answer.reported,
        'photos', answer_photos
      )
    )
  ) AS question_and_answers
  FROM question
  JOIN answer ON answer.id_question = question.id
  LEFT JOIN (
    SELECT
      id_answer,
      ARRAY_AGG(url) AS answer_photos
    FROM answer_photos
    GROUP BY id_answer
  ) AS subquery ON subquery.id_answer = answer.id
  WHERE question.product_id = ${req.params.product_id} AND question.reported = ${false}
  GROUP BY question.id`);
  console.log(query.rows)

  const result = {
    product_id: `${req.params.product_id}`,
    results: []
  }

  query.rows.forEach((question) => {
    result.results.push(question.question_and_answers);
  });

  res.send(result);
});


qaRouter.get('/questions/:question_id/answers', async (req, res) => {
  // add functionality to account for headers on count and page
  const query = await db.query(`
  SELECT
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'answerid', answer.id,
      'body', answer.body,
      'date', answer.date_written,
      'answerer_name', answer.answerer_name,
      'helpfulness', answer.helpful,
      'reported', answer.reported,
      'photos', subquery.answer_photos
    )
  ) AS answers_with_photos
  FROM answer
  LEFT JOIN (
    SELECT
      id_answer,
      JSON_AGG(JSON_BUILD_OBJECT('url', url)) AS answer_photos
    FROM answer_photos
    GROUP BY id_answer
  ) AS subquery ON subquery.id_answer = answer.id


  WHERE answer.id_question = ${req.params.question_id} AND answer.reported = ${false}`);

  const result = {
    question: `${req.params.question_id}`,
    page: `${req.params.page}`,
    count: `${req.params.count}`,
    results: []
  }
  query.rows[0].answers_with_photos.forEach((answer) => {
    result.results.push(answer);
  });

  res.send(result);
});



module.exports = qaRouter;