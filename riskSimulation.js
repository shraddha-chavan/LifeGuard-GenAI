/**
 * Risk Simulation Engine
 * Predicts how risk levels change over time using environmental trends
 */

class RiskSimulation {
    constructor() {
        this.weatherTrends = {
            'clear': { stability: 0.8, deterioration_rate: 0.1 },
            'cloudy': { stability: 0.6, deterioration_rate: 0.2 },
            'rainy': { stability: 0.4, deterioration_rate: 0.3 },
            'stormy': { stability: 0.2, deterioration_rate: 0.5 },
            'foggy': { stability: 0.5, deterioration_rate: 0.2 }
        };

        this.crowdPatterns = {
            'isolated': { peak_hours: [], growth_rate: 0.1 },
            'light': { peak_hours: [8, 12, 17], growth_rate: 0.2 },
            'moderate': { peak_hours: [9, 13, 18], growth_rate: 0.3 },
            'heavy': { peak_hours: [10, 14, 19], growth_rate: 0.4 },
            'overcrowded': { peak_hours: [11, 15, 20], growth_rate: 0.5 }
        };

        this.timeFactors = {
            dawn: { risk_multiplier: 1.2, visibility_factor: 0.6 },
            morning: { risk_multiplier: 0.8, visibility_factor: 1.0 },
            afternoon: { risk_multiplier: 0.7, visibility_factor: 1.0 },
            evening: { risk_multiplier: 1.1, visibility_factor: 0.8 },
            night: { risk_multiplier: 1.5, visibility_factor: 0.4 },
            late_night: { risk_multiplier: 1.8, visibility_factor: 0.3 }
        };
    }

    /**
     * Main simulation function - predicts risk changes over time
     * @param {Object} initialConditions - Starting environmental conditions
     * @param {Object} trends - Environmental trend parameters
     * @param {number} hoursAhead - How many hours to simulate
     * @param {number} intervalMinutes - Simulation interval in minutes
     * @returns {Object} Simulation results with risk predictions
     */
    simulateRiskProgression(initialConditions, trends = {}, hoursAhead = 6, intervalMinutes = 30) {
        try {
            // Validate inputs
            this.validateSimulationInputs(initialConditions, hoursAhead, intervalMinutes);

            // Initialize simulation parameters
            const intervals = Math.ceil((hoursAhead * 60) / intervalMinutes);
            const startTime = new Date();
            const predictions = [];

            // Set default trends if not provided
            const defaultTrends = this.generateDefaultTrends(initialConditions);
            const simulationTrends = { ...defaultTrends, ...trends };

            // Run simulation for each time interval
            for (let i = 0; i <= intervals; i++) {
                const currentTime = new Date(startTime.getTime() + (i * intervalMinutes * 60000));
                const timeElapsed = i * intervalMinutes / 60; // hours

                // Calculate environmental conditions at this time
                const conditions = this.calculateConditionsAtTime(
                    initialConditions, 
                    simulationTrends, 
                    timeElapsed, 
                    currentTime
                );

                // Assess risk for these conditions
                const riskAssessment = this.assessRiskAtTime(conditions, currentTime);

                // Add prediction point
                predictions.push({
                    time: currentTime.toISOString(),
                    hours_from_start: timeElapsed,
                    conditions: conditions,
                    risk_assessment: riskAssessment,
                    confidence: this.calculateConfidence(timeElapsed)
                });
            }

            // Analyze trends and generate insights
            const analysis = this.analyzeTrends(predictions);

            return {
                success: true,
                simulation_parameters: {
                    start_time: startTime.toISOString(),
                    hours_ahead: hoursAhead,
                    interval_minutes: intervalMinutes,
                    total_predictions: predictions.length
                },
                initial_conditions: initialConditions,
                trends_used: simulationTrends,
                predictions: predictions,
                trend_analysis: analysis,
                recommendations: this.generateTimeBasedRecommendations(analysis)
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
     * Validate simulation inputs
     */
    validateSimulationInputs(conditions, hoursAhead, intervalMinutes) {
        if (!conditions || typeof conditions !== 'object') {
            throw new Error('Initial conditions must be a valid object');
        }

        if (hoursAhead <= 0 || hoursAhead > 48) {
            throw new Error('Hours ahead must be between 1 and 48');
        }

        if (intervalMinutes <= 0 || intervalMinutes > 240) {
            throw new Error('Interval minutes must be between 1 and 240');
        }
    }

    /**
     * Generate default environmental trends
     */
    generateDefaultTrends(initialConditions) {
        return {
            weather_trend: {
                direction: 'stable', // 'improving', 'deteriorating', 'stable'
                rate: 0.1, // change rate per hour
                volatility: 0.2 // random variation
            },
            crowd_trend: {
                direction: 'cyclical', // 'increasing', 'decreasing', 'cyclical', 'stable'
                peak_times: [9, 13, 18], // hours when crowds peak
                base_growth_rate: 0.05
            },
            visibility_trend: {
                weather_dependent: true,
                time_dependent: true,
                base_visibility: 0.8
            },
            temperature_trend: {
                direction: 'stable',
                daily_variation: 10, // degrees variation
                rate: 0.5 // change rate per hour
            }
        };
    }

    /**
     * Calculate environmental conditions at a specific time
     */
    calculateConditionsAtTime(initialConditions, trends, hoursElapsed, currentTime) {
        const conditions = { ...initialConditions };

        // Update weather based on trends
        conditions.weather = this.simulateWeatherChange(
            initialConditions.weather, 
            trends.weather_trend, 
            hoursElapsed
        );

        // Update crowd density based on time and trends
        conditions.crowd_density = this.simulateCrowdChange(
            initialConditions.crowd_density,
            trends.crowd_trend,
            currentTime,
            hoursElapsed
        );

        // Update time context
        conditions.time = this.getTimeContext(currentTime);

        // Calculate visibility based on weather and time
        conditions.visibility = this.calculateVisibility(
            conditions.weather,
            conditions.time,
            trends.visibility_trend
        );

        // Add environmental factors
        conditions.temperature_factor = this.simulateTemperatureChange(
            trends.temperature_trend,
            currentTime,
            hoursElapsed
        );

        return conditions;
    }

    /**
     * Simulate weather changes over time
     */
    simulateWeatherChange(initialWeather, weatherTrend, hoursElapsed) {
        const weatherStates = ['clear', 'cloudy', 'rainy', 'stormy', 'foggy'];
        const currentIndex = weatherStates.indexOf(initialWeather.toLowerCase()) || 0;
        
        let newIndex = currentIndex;
        const changeRate = weatherTrend.rate * hoursElapsed;
        const randomFactor = (Math.random() - 0.5) * weatherTrend.volatility;

        if (weatherTrend.direction === 'deteriorating') {
            newIndex = Math.min(weatherStates.length - 1, currentIndex + Math.floor(changeRate + randomFactor));
        } else if (weatherTrend.direction === 'improving') {
            newIndex = Math.max(0, currentIndex - Math.floor(changeRate + randomFactor));
        } else {
            // Stable with minor variations
            newIndex = Math.max(0, Math.min(weatherStates.length - 1, 
                currentIndex + Math.floor(randomFactor * 2)));
        }

        return weatherStates[newIndex];
    }

    /**
     * Simulate crowd density changes
     */
    simulateCrowdChange(initialCrowd, crowdTrend, currentTime, hoursElapsed) {
        const crowdLevels = ['isolated', 'light', 'moderate', 'heavy', 'overcrowded'];
        const currentIndex = crowdLevels.indexOf(initialCrowd.toLowerCase()) || 1;
        const currentHour = currentTime.getHours();

        let modifier = 0;

        if (crowdTrend.direction === 'cyclical') {
            // Check if current time is near peak hours
            const nearPeak = crowdTrend.peak_times.some(peakHour => 
                Math.abs(currentHour - peakHour) <= 1
            );
            
            if (nearPeak) {
                modifier = 1; // Increase crowd during peak times
            } else {
                modifier = -0.5; // Decrease during off-peak
            }
        } else if (crowdTrend.direction === 'increasing') {
            modifier = crowdTrend.base_growth_rate * hoursElapsed;
        } else if (crowdTrend.direction === 'decreasing') {
            modifier = -crowdTrend.base_growth_rate * hoursElapsed;
        }

        const newIndex = Math.max(0, Math.min(crowdLevels.length - 1, 
            Math.round(currentIndex + modifier)));

        return crowdLevels[newIndex];
    }

    /**
     * Get time context for a given date
     */
    getTimeContext(date) {
        const hour = date.getHours();
        
        if (hour >= 5 && hour < 8) return 'dawn';
        if (hour >= 8 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 20) return 'evening';
        if (hour >= 20 && hour < 24) return 'night';
        return 'late_night';
    }

    /**
     * Calculate visibility based on weather and time
     */
    calculateVisibility(weather, timeContext, visibilityTrend) {
        let visibility = visibilityTrend.base_visibility;

        // Weather impact on visibility
        const weatherImpact = {
            'clear': 1.0,
            'cloudy': 0.8,
            'rainy': 0.5,
            'stormy': 0.3,
            'foggy': 0.2
        };

        visibility *= (weatherImpact[weather] || 0.8);

        // Time impact on visibility
        if (visibilityTrend.time_dependent) {
            const timeImpact = this.timeFactors[timeContext]?.visibility_factor || 0.8;
            visibility *= timeImpact;
        }

        return Math.max(0.1, Math.min(1.0, visibility));
    }

    /**
     * Simulate temperature changes
     */
    simulateTemperatureChange(tempTrend, currentTime, hoursElapsed) {
        const hour = currentTime.getHours();
        
        // Daily temperature cycle (simplified)
        const dailyCycle = Math.sin((hour - 6) * Math.PI / 12); // Peak at 2 PM
        const baseTemp = 20 + (dailyCycle * tempTrend.daily_variation / 2);
        
        // Apply trend
        let trendAdjustment = 0;
        if (tempTrend.direction === 'increasing') {
            trendAdjustment = tempTrend.rate * hoursElapsed;
        } else if (tempTrend.direction === 'decreasing') {
            trendAdjustment = -tempTrend.rate * hoursElapsed;
        }

        return baseTemp + trendAdjustment;
    }

    /**
     * Assess risk at a specific time using existing assessment function
     */
    assessRiskAtTime(conditions, currentTime) {
        // Import the assessRisk function (assuming it's available)
        if (typeof assessRisk === 'function') {
            return assessRisk(
                conditions.location || 'unknown location',
                conditions.time,
                conditions.weather,
                conditions.crowd_density
            );
        }

        // Fallback simple assessment
        return this.simpleRiskAssessment(conditions);
    }

    /**
     * Simple fallback risk assessment
     */
    simpleRiskAssessment(conditions) {
        let score = 0;
        
        const weatherScores = { 'clear': 0, 'cloudy': 1, 'rainy': 2, 'stormy': 3, 'foggy': 2 };
        const crowdScores = { 'isolated': 1, 'light': 0, 'moderate': 1, 'heavy': 2, 'overcrowded': 3 };
        const timeScores = { 'dawn': 1, 'morning': 0, 'afternoon': 0, 'evening': 1, 'night': 2, 'late_night': 3 };

        score += weatherScores[conditions.weather] || 0;
        score += crowdScores[conditions.crowd_density] || 0;
        score += timeScores[conditions.time] || 0;

        const level = score >= 5 ? 'HIGH' : score >= 3 ? 'MEDIUM' : 'LOW';
        
        return {
            risk_level: level,
            risk_score: score,
            factors: []
        };
    }

    /**
     * Calculate prediction confidence based on time elapsed
     */
    calculateConfidence(hoursElapsed) {
        // Confidence decreases over time
        const baseConfidence = 0.95;
        const decayRate = 0.05; // 5% decrease per hour
        return Math.max(0.3, baseConfidence - (decayRate * hoursElapsed));
    }

    /**
     * Analyze trends in the predictions
     */
    analyzeTrends(predictions) {
        const riskLevels = predictions.map(p => p.risk_assessment.risk_level);
        const riskScores = predictions.map(p => p.risk_assessment.risk_score);

        // Calculate trend direction
        const firstScore = riskScores[0];
        const lastScore = riskScores[riskScores.length - 1];
        const trendDirection = lastScore > firstScore ? 'increasing' : 
                             lastScore < firstScore ? 'decreasing' : 'stable';

        // Find peak risk time
        const maxScore = Math.max(...riskScores);
        const peakIndex = riskScores.indexOf(maxScore);
        const peakTime = predictions[peakIndex];

        // Calculate risk level changes
        const riskChanges = [];
        for (let i = 1; i < predictions.length; i++) {
            if (predictions[i].risk_assessment.risk_level !== predictions[i-1].risk_assessment.risk_level) {
                riskChanges.push({
                    time: predictions[i].time,
                    from: predictions[i-1].risk_assessment.risk_level,
                    to: predictions[i].risk_assessment.risk_level
                });
            }
        }

        return {
            trend_direction: trendDirection,
            peak_risk: {
                time: peakTime.time,
                level: peakTime.risk_assessment.risk_level,
                score: peakTime.risk_assessment.risk_score
            },
            risk_changes: riskChanges,
            average_score: riskScores.reduce((a, b) => a + b, 0) / riskScores.length,
            volatility: this.calculateVolatility(riskScores)
        };
    }

    /**
     * Calculate volatility of risk scores
     */
    calculateVolatility(scores) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        return Math.sqrt(variance);
    }

    /**
     * Generate time-based recommendations
     */
    generateTimeBasedRecommendations(analysis) {
        const recommendations = [];

        if (analysis.trend_direction === 'increasing') {
            recommendations.push('Risk levels are expected to increase - prepare for escalating conditions');
            recommendations.push('Consider completing activities earlier than planned');
        } else if (analysis.trend_direction === 'decreasing') {
            recommendations.push('Conditions are expected to improve over time');
            recommendations.push('Consider delaying non-essential activities if currently high risk');
        }

        if (analysis.peak_risk.level === 'HIGH') {
            recommendations.push(`Peak risk expected at ${new Date(analysis.peak_risk.time).toLocaleTimeString()}`);
            recommendations.push('Plan activities to avoid peak risk periods');
        }

        if (analysis.volatility > 1.5) {
            recommendations.push('Conditions are highly variable - monitor frequently');
            recommendations.push('Be prepared for rapid changes in risk levels');
        }

        if (analysis.risk_changes.length > 3) {
            recommendations.push('Multiple risk level changes expected - stay flexible with plans');
        }

        return recommendations;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RiskSimulation;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.RiskSimulation = RiskSimulation;
}