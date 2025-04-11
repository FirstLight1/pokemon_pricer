const axios = require('axios');

exports.handler = async function(event) {
  // Your API key will be securely stored as an environment variable
  const API_KEY = process.env.POKEMON_TCG_API_KEY;
  
  // Get search parameters from the request
  const searchParam = event.queryStringParameters.q || '';
  
  try {
    // Forward the request to the Pokémon TCG API with your API key
    const response = await axios.get(`https://api.pokemontcg.io/v2/cards?q=${searchParam}`, {
      headers: {
        'X-Api-Key': API_KEY
      }
    });
    
    // Return the API response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    // Handle errors
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch data',
        message: error.message
      })
    };
  }
};