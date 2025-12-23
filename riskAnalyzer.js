/**
 * LifeGuard Risk Analyzer
 * Processes environmental JSON data and calculates comprehensive risk scores
 */

class RiskAnalyzer {
    constructor() {
        this.riskFactors = {
            weather: {
                'clear': 0,
                'sunny': 0,
                'cloudy': 1,
                'overcast': 1,
                'light_rain': 2,
                'rainy': 3,
                'heavy_rain': 4,
                'thunderstorm': 5,
                'stormy': 5,
                'foggy': 3,
                'snow': 3,
                'blizzard': 5,
                'hail': 4,
                'tornado': 10,
                'hurricane': 10
            },
            crowdDensity: {
                'isolated': 2,
                'very_light': 1,
                'light': 0,
                'moderate': 1,
                'heavy': 2,
                'very_heavy': 3,
                'overcrowded': 4,
                'dangerous_crowd': 5
            },
            timeOfDay: {
                'early_morning': 1,  // 4-6 AM
                'morning': 0,        // 6-12 PM
                'afternoon': 0,      // 12-5 PM
                'evening': 1,        // 5-8 PM
                'night': 2,          // 8 PM-12 AM
                'late_night': 3      // 12-4 AM
            },
            visibility: {
                'excellent': 0,
                'good': 0,
                'fair': 1,
                'poor': 3,
                'very_poor': 4,
                'zero': 5
            },
            temperature: {
                'extreme_cold': 3,   // < -10°C
                'very_cold': 2,      // -10 to 0°C
                'cold': 1,           // 0 to 10°C
                'comfortable': 0,    // 10 to 25°C
                'warm': 0,           // 25 to 30°C
                'hot': 1,            // 30 to 35°C
                'very_hot': 2,       // 35 to 40°C
                'extreme_heat': 3    // > 40°C
            }
        };
    }

    /**
     * Main analysis function - processes environmental data and returns risk assessment
     * @param {Object} environmentalData - JSON object containing environmental parameters
     * @returns {Object} Complete risk analysis with score, level, and recommendations
     */
    analyzeRisk(environmentalData) {
        try {
            // Validate input data
            this.validateInput(environmentalData);

            // Extract and normalize data
            const normalizedData = this.normalizeData(environmentalData);

            // Calculate individual risk components
            const riskComponents = this.calculateRiskComponents(normalizedData);

            // Calculate total risk score
            const totalScore = this.calculateTotalScore(riskComponents);

            // Determine risk level and category
            const riskLevel = this.determineRiskLevel(totalScore);

            // Generate recommendations
            const recommendations = this.generateRecommendations(riskComponents, riskLevel);

            // Create comprehensive analysis result
            return {
                success: true,
                timestamp: new Date().toISOString(),
                input_data: environmentalData,
                normalized_data: normalizedData,
                risk_components: riskComponents,
                total_score: totalScore,
                risk_level: riskLevel,
                recommendations: recommendations,
                analysis_summary: this.generateSummary(normalizedData, riskLevel, totalScore)
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Validates the input environmental data
     * @param {Object} data - Environmental data to validate
     */
    validateInput(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Environmental data must be a valid object');
        }

        // Check for required fields
        const requiredFields = ['location_context', 'time_context', 'weather_context'];
        for (const field of requiredFields) {
            if (!data.hasOwnProperty(field)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    /**
     * Normalizes and standardizes input data
     * @param {Object} data - Raw environmental data
     * @returns {Object} Normalized data
     */
    normalizeData(data) {
        return {
            location: this.parseLocation(data.location_context),
            time: this.parseTime(data.time_context),
            weather: this.parseWeather(data.weather_context),
            crowd: this.parseCrowd(data.movement_context || data.crowd_context || ''),
            visibility: this.parseVisibility(data.visibility_context || ''),
            temperature: this.parseTemperature(data.temperature_context || ''),
            environment_summary: data.environment_summary || ''
        };
    }

    /**
     * Parse location context for risk factors
     */
    parseLocation(locationContext) {
        const location = locationContext.toLowerCase();
        let riskFactors = [];

        if (location.includes('remote') || location.includes('isolated')) {
            riskFactors.push('isolated_area');
        }
        if (location.includes('urban') || location.includes('city')) {
            riskFactors.push('urban_area');
        }
        if (location.includes('water') || location.includes('beach') || location.includes('lake')) {
            riskFactors.push('water_proximity');
        }
        if (location.includes('mountain') || location.includes('hill')) {
            riskFactors.push('elevation');
        }

        return {
            raw: locationContext,
            risk_factors: riskFactors
        };
    }

    /**
     * Parse time context and determine time-based risk
     */
    parseTime(timeContext) {
        const time = timeContext.toLowerCase();
        let timeCategory = 'morning';

        if (time.includes('night') || time.includes('midnight')) {
            timeCategory = 'night';
        } else if (time.includes('late night') || time.includes('early morning')) {
            timeCategory = 'late_night';
        } else if (time.includes('evening')) {
            timeCategory = 'evening';
        } else if (time.includes('afternoon')) {
            timeCategory = 'afternoon';
        }

        return {
            raw: timeContext,
            category: timeCategory,
            risk_score: this.riskFactors.timeOfDay[timeCategory] || 0
        };
    }

    /**
     * Parse weather conditions
     */
    parseWeather(weatherContext) {
        const weather = weatherContext.toLowerCase();
        let weatherType = 'clear';

        // Check for severe weather first
        if (weather.includes('tornado') || weather.includes('hurricane')) {
            weatherType = weather.includes('tornado') ? 'tornado' : 'hurricane';
        } else if (weather.includes('thunderstorm') || weather.includes('storm')) {
            weatherType = 'thunderstorm';
        } else if (weather.includes('blizzard')) {
            weatherType = 'blizzard';
        } else if (weather.includes('heavy rain') || weather.includes('downpour')) {
            weatherType = 'heavy_rain';
        } else if (weather.includes('rain')) {
            weatherType = 'rainy';
        } else if (weather.includes('fog')) {
            weatherType = 'foggy';
        } else if (weather.includes('snow')) {
            weatherType = 'snow';
        } else if (weather.includes('cloud')) {
            weatherType = 'cloudy';
        }

        return {
            raw: weatherContext,
            type: weatherType,
            risk_score: this.riskFactors.weather[weatherType] || 0
        };
    }

    /**
     * Parse crowd/movement context
     */
    parseCrowd(crowdContext) {
        const crowd = crowdContext.toLowerCase();
        let crowdLevel = 'light';

        if (crowd.includes('overcrowded') || crowd.includes('packed')) {
            crowdLevel = 'overcrowded';
        } else if (crowd.includes('heavy') || crowd.includes('dense')) {
            crowdLevel = 'heavy';
        } else if (crowd.includes('moderate')) {
            crowdLevel = 'moderate';
        } else if (crowd.includes('isolated') || crowd.includes('alone')) {
            crowdLevel = 'isolated';
        }

        return {
            raw: crowdContext,
            level: crowdLevel,
            risk_score: this.riskFactors.crowdDensity[crowdLevel] || 0
        };
    }

    /**
     * Parse visibility conditions
     */
    parseVisibility(visibilityContext) {
        const visibility = visibilityContext.toLowerCase();
        let visibilityLevel = 'good';

        if (visibility.includes('zero') || visibility.includes('no visibility')) {
            visibilityLevel = 'zero';
        } else if (visibility.includes('very poor') || visibility.includes('extremely poor')) {
            visibilityLevel = 'very_poor';
        } else if (visibility.includes('poor')) {
            visibilityLevel = 'poor';
        } else if (visibility.includes('fair')) {
            visibilityLevel = 'fair';
        } else if (visibility.includes('excellent')) {
            visibilityLevel = 'excellent';
        }

        return {
            raw: visibilityContext,
            level: visibilityLevel,
            risk_score: this.riskFactors.visibility[visibilityLevel] || 0
        };
    }

    /**
     * Parse temperature conditions
     */
    parseTemperature(temperatureContext) {
        const temp = temperatureContext.toLowerCase();
        let tempCategory = 'comfortable';

        if (temp.includes('extreme cold') || temp.includes('freezing')) {
            tempCategory = 'extreme_cold';
        } else if (temp.includes('very cold')) {
            tempCategory = 'very_cold';
        } else if (temp.includes('cold')) {
            tempCategory = 'cold';
        } else if (temp.includes('extreme heat') || temp.includes('scorching')) {
            tempCategory = 'extreme_heat';
        } else if (temp.includes('very hot')) {
            tempCategory = 'very_hot';
        } else if (temp.includes('hot')) {
            tempCategory = 'hot';
        }

        return {
            raw: temperatureContext,
            category: tempCategory,
            risk_score: this.riskFactors.temperature[tempCategory] || 0
        };
    }

    /**
     * Calculate individual risk component scores
     */
    calculateRiskComponents(normalizedData) {
        return {
            weather_risk: normalizedData.weather.risk_score,
            time_risk: normalizedData.time.risk_score,
            crowd_risk: normalizedData.crowd.risk_score,
            visibility_risk: normalizedData.visibility.risk_score,
            temperature_risk: normalizedData.temperature.risk_score,
            location_risk: this.calculateLocationRisk(normalizedData.location)
        };
    }

    /**
     * Calculate location-based risk
     */
    calculateLocationRisk(locationData) {
        let risk = 0;
        
        if (locationData.risk_factors.includes('isolated_area')) risk += 2;
        if (locationData.risk_factors.includes('water_proximity')) risk += 1;
        if (locationData.risk_factors.includes('elevation')) risk += 1;
        
        return risk;
    }

    /**
     * Calculate total weighted risk score
     */
    calculateTotalScore(components) {
        const weights = {
            weather_risk: 0.25,
            time_risk: 0.15,
            crowd_risk: 0.20,
            visibility_risk: 0.15,
            temperature_risk: 0.15,
            location_risk: 0.10
        };

        let totalScore = 0;
        for (const [component, score] of Object.entries(components)) {
            totalScore += score * (weights[component] || 0);
        }

        return Math.round(totalScore * 10) / 10; // Round to 1 decimal place
    }

    /**
     * Determine risk level based on total score
     */
    determineRiskLevel(totalScore) {
        if (totalScore >= 4.0) {
            return {
                level: 'CRITICAL',
                color: '#dc2626',
                priority: 5,
                description: 'Immediate danger - take emergency action'
            };
        } else if (totalScore >= 3.0) {
            return {
                level: 'HIGH',
                color: '#ea580c',
                priority: 4,
                description: 'High risk - exercise extreme caution'
            };
        } else if (totalScore >= 2.0) {
            return {
                level: 'MEDIUM',
                color: '#d97706',
                priority: 3,
                description: 'Moderate risk - stay alert and prepared'
            };
        } else if (totalScore >= 1.0) {
            return {
                level: 'LOW',
                color: '#65a30d',
                priority: 2,
                description: 'Low risk - basic precautions recommended'
            };
        } else {
            return {
                level: 'MINIMAL',
                color: '#16a34a',
                priority: 1,
                description: 'Minimal risk - normal activities safe'
            };
        }
    }

    /**
     * Generate specific recommendations based on risk components
     */
    generateRecommendations(components, riskLevel) {
        const recommendations = [];

        // Weather-based recommendations
        if (components.weather_risk >= 3) {
            recommendations.push('Seek immediate shelter from severe weather');
            recommendations.push('Monitor weather alerts and warnings');
        } else if (components.weather_risk >= 2) {
            recommendations.push('Stay indoors if possible');
            recommendations.push('Carry weather protection gear');
        }

        // Time-based recommendations
        if (components.time_risk >= 2) {
            recommendations.push('Use additional lighting and visibility aids');
            recommendations.push('Travel with others when possible');
            recommendations.push('Stay in well-lit, populated areas');
        }

        // Crowd-based recommendations
        if (components.crowd_risk >= 3) {
            recommendations.push('Avoid overcrowded areas');
            recommendations.push('Identify multiple exit routes');
        } else if (components.crowd_risk >= 2 && components.crowd_risk < 3) {
            recommendations.push('Maintain communication with others');
            recommendations.push('Carry emergency contact information');
        }

        // Visibility recommendations
        if (components.visibility_risk >= 3) {
            recommendations.push('Postpone travel until visibility improves');
            recommendations.push('Use high-visibility clothing and lights');
        }

        // General recommendations based on overall risk level
        if (riskLevel.priority >= 4) {
            recommendations.push('Consider emergency evacuation');
            recommendations.push('Contact emergency services if needed');
        } else if (riskLevel.priority >= 3) {
            recommendations.push('Keep emergency supplies accessible');
            recommendations.push('Maintain constant communication');
        }

        return recommendations.length > 0 ? recommendations : ['Continue normal activities with basic safety awareness'];
    }

    /**
     * Generate analysis summary
     */
    generateSummary(normalizedData, riskLevel, totalScore) {
        return `Risk analysis complete: ${riskLevel.level} risk level (${totalScore}/5.0) detected. ` +
               `Primary factors: ${normalizedData.weather.type} weather, ${normalizedData.time.category} time period, ` +
               `${normalizedData.crowd.level} crowd density. ${riskLevel.description}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RiskAnalyzer;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.RiskAnalyzer = RiskAnalyzer;
}