// implementation of stretch - project structure,
const { query } = require('./index.js');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return query(`
    SELECT * 
    FROM users
    WHERE users.email = $1
    `, [email])
    .then((result) => {
      // if no user with the given email is present, returns null
      if (result.rows.length === 0) {
        return null;
        // else resolves with a user object with the given email address
      } else {
        console.log('getUserWithEmail', result.rows[0]);
        return result.rows[0];
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return query(`
    SELECT * 
    FROM users
    WHERE users.id = $1
    `, [id])
    .then((result) => {
      // if no user with the given id is present, returns null
      if (result.rows.length === 0) {
        return null;
        // else resolves with a user object with the given user id
      } else {
        console.log('getUserWithId', result.rows[0]);
        return result.rows[0];
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  // RETURNING * below returns the objects that were inserted
  return query(`
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
    `, [user.name, user.email, user.password])
    .then((result) => {
      console.log('addUser', result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return query(`
    SELECT reservations.*
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;
    `, [guest_id, limit])
    .then((result) => {
      console.log('getAllReservations', result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  // empty array to hold any parameters that may be available for the query
  const queryParams = [];
  
  // initial query with all information that comes before the WHERE clauses
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // use WHERE keyword to start. This changes to AND later when needed.
  let conditionWord = 'WHERE';

  for (const key in options) {
    if (key === 'minimum_rating') {
      continue;
    } else if (key === 'owner_id') {
      queryParams.push(`${options[key]}`);
      // use .length to get the $n placeholder number
      queryString += `${conditionWord} owner_id = $${queryParams.length}`;
    } else if (key === 'city') {
      // include %% for using with LIKE so City will show up in search
      queryParams.push(`%${options[key]}%`);
      queryString += `${conditionWord} city LIKE $${queryParams.length}`;
    } else {
      // multiply options[key] with 100 since price is in cents in the database
      queryParams.push(`${options[key] * 100}`);

      if (key === 'minimum_price_per_night') {
        queryString += `${conditionWord} cost_per_night >= $${queryParams.length}`;
      }
  
      if (key === 'maximum_price_per_night') {
        queryString += `${conditionWord} cost_per_night <= $${queryParams.length}`;
      }
    }
    // change conditionWord to AND after initial use of WHERE if WHERE is used
    conditionWord = ' AND';
  }

  queryString += `
  GROUP BY properties.id
  `;
  // if statement is below the for loop so the HAVING occurs after the GROUP BY
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `HAVING avg(rating) >= $${queryParams.length}`;
  }

  // query that comes after the WHERE clauses (if any)
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log('queryString', queryString, queryParams);

  return query(queryString, queryParams).then((res) => {
    console.log('getAllProperties', res.rows);
    return res.rows;
  });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  return query(`
    INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `, [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ])
    .then((result) => {
      console.log('addProperty', result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
