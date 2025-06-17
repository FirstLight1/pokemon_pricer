// Pokemon TCG API endpoint
        const API_URL = 'https://api.pokemontcg.io/v2';
        
        function convertUSDtoEUR(usdAmount) {
        // Calculate the conversion
        const exchangeRate = 0.92;
        const eurAmount = usdAmount * exchangeRate;
        
        // Return rounded to 2 decimal places for currency
        return Math.round(eurAmount * 100) / 100;
        }
        
        
        // DOM elements
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const resultsContainer = document.getElementById('results');
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        
        // Search for cards

        async function searchCards() {
            const searchTerm = searchInput.value.trim();
            
            if (!searchTerm) {
                showError('Please enter a Pokémon name or number');
                return;
            }
            
            showLoading();
            clearResults();
            clearError();
            
            try {
                // Parse the search term to handle different search types
                const queryParams = parseSearchTerm(searchTerm);
                
                // Build query string for API
                let queryString = '';
                if (queryParams.name && queryParams.number) {
                    queryString = `name:"${queryParams.name}" number:${queryParams.number}`;
                } else if (queryParams.name) {
                    queryString = `name:"${queryParams.name}"`;
                } else if (queryParams.number) {
                    queryString = `number:${queryParams.number}`;
                }
                
                // Use the proxy instead of calling the API directly
                const response = await fetch(`/api/pokemon-api?q=${encodeURIComponent(queryString)}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                
                const data = await response.json();
                
                if (data.data.length === 0) {
                    showError('No cards found. Try another search term.');
                } else {
                    displayResults(data.data);
                }
            } catch (error) {
                showError('Error fetching cards. Please try again later.');
                console.error('Error:', error);
            } finally {
                hideLoading();
            }
        }
                
        // Parse search term to extract name and/or number
        function parseSearchTerm(term) {
            const result = { name: null, number: null };
            
            // Check if term is just a number
            if (/^\d+$/.test(term)) {
                result.number = term;
                return result;
            }
            
            // Check for format like "Pikachu 25/124"
            const nameNumberMatch = term.match(/^(.+?)\s+(\d+)(?:\/\d+)?$/);
            if (nameNumberMatch) {
                result.name = nameNumberMatch[1].trim();
                result.number = nameNumberMatch[2].trim();
                return result;
            }
            
            // Default to name search
            result.name = term;
            return result;
        }
        
        // Display card results
        function displayResults(cards) {
            cards.forEach(card => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                
                // Check if CardMarket prices are available
                const hasCardMarketPrices = card.cardmarket && card.cardmarket.prices && 
                    (card.cardmarket.prices.averageSellPrice || 
                     card.cardmarket.prices.trendPrice || 
                     card.cardmarket.prices.lowPriceExPlus);
                
                // Check if TCGPlayer prices are available
                const hasTcgPlayerPrices = card.tcgplayer && card.tcgplayer.prices && 
                    Object.keys(card.tcgplayer.prices).length > 0;
                
                let priceHTML = '';
                let priceSourceHTML = '';
                
                // First try to use CardMarket prices
                if (hasCardMarketPrices) {
                    priceSourceHTML = '<div class="price-source source-cardmarket">CardMarket Prices (€)</div>';
                    
                    const avgPrice = card.cardmarket.prices.averageSellPrice;
                    const avg7 = card.cardmarket.prices.avg7;
                    const trendPrice = card.cardmarket.prices.trendPrice;
                    const lowPriceExPlus = card.cardmarket.prices.lowPriceExPlus;
                    const lowPriceFoil = card.cardmarket.prices.lowPriceFoil;
                    
                    priceHTML = `
                        <div><span class="price-label">Average Sell:</span> <span>${formatPrice(avgPrice, '€')}</span></div>
                        <div><span class="price-label">Average 7 day:</span> <span>${formatPrice(avg7, '€')}</span></div>
                        <div><span class="price-label">Trend Price:</span> <span>${formatPrice(trendPrice, '€')}</span></div>
                        <div><span class="price-label">Low Price:</span> <span>${formatPrice(lowPriceExPlus, '€')}</span></div>
                        ${lowPriceFoil ? `<div><span class="price-label">Low Price (Foil):</span> <span>${formatPrice(lowPriceFoil, '€')}</span></div>` : ''}
                    `;
                } 
                // Fall back to TCGPlayer prices if CardMarket not available
                else if (hasTcgPlayerPrices) {
                    priceSourceHTML = '<div class="price-source source-tcgplayer">TCGPlayer Prices ($)</div>';
                    
                    // Find the first available price variant (normal, holofoil, reverseHolofoil, etc.)
                    const priceVariants = Object.keys(card.tcgplayer.prices);
                    
                    if (priceVariants.length > 0) {
                        const variant = priceVariants[0];
                        const prices = card.tcgplayer.prices[variant];
                        
                        priceHTML = `
                            <div><span class="price-label">Market:</span> <span>${formatPrice(convertUSDtoEUR(prices.market), '€')}</span></div>
                            <div><span class="price-label">Mid:</span> <span>${formatPrice(convertUSDtoEUR(prices.mid), '€')}</span></div>
                            <div><span class="price-label">Low:</span> <span>${formatPrice(convertUSDtoEUR(prices.low), '€')}</span></div>
                            <div><span class="price-label">Variant:</span> <span>${capitalizeFirstLetter(variant)}</span></div>
                        `;
                    } else {
                        priceHTML = '<div class="no-price">No specific price data available</div>';
                    }
                } else {
                    priceHTML = '<div class="no-price">No price data available</div>';
                }
                
                cardElement.innerHTML = `
                    <img class="card-image" src="${card.images.small}" alt="${card.name}">
                    <div class="card-info">
                        <div class="card-name">${card.name}</div>
                        <div class="card-set">${card.set.name} - ${card.number}/${card.set.printedTotal}</div>
                        <div class="card-rarity">Rarity: ${card.rarity || 'Unknown'}</div>
                        ${priceSourceHTML}
                        <div class="price-info">
                            ${priceHTML}
                        </div>
                    </div>
                `;
                
                resultsContainer.appendChild(cardElement);
            });
        }
        
        // Format price display
        function formatPrice(price, currencySymbol) {
            if (price === null || price === undefined) {
                return '<span class="no-price">Not available</span>';
            }
            return `${currencySymbol}${price.toFixed(2)}`;
        }
        
        // Capitalize first letter of a string
        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1).replace(/([A-Z])/g, ' $1');
        }
        
        // Helper functions
        function clearResults() {
            resultsContainer.innerHTML = '';
        }
        
        function showLoading() {
            loadingElement.style.display = 'block';
        }
        
        function hideLoading() {
            loadingElement.style.display = 'none';
        }
        
        function showError(message) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        function clearError() {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        // Event listeners
        searchButton.addEventListener('click', searchCards);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchCards();
            }
        });