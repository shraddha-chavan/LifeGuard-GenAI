/**
 * Anomaly Detection System
 * Flags sudden deviations in environmental or movement data patterns
 */

class AnomalyDetector {
    constructor(options = {}) {
        // Configuration parameters
        this.config = {
            windowSize: options.windowSize || 10, // Number of data points for baseline
            sensitivityThreshold: options.sensitivityThreshold || 2.5, // Standard deviations for anomaly
            minDataPoints: options.minDataPoints || 5, // Minimum points needed for detection
            decayFactor: options.decayFactor || 0.95, // Weight decay for older data
            adaptiveThreshold: options.adaptiveThreshold || true, // Enable adaptive thresholds
            maxAnomalyScore: options.maxAnomalyScore || 10.0 // Maximum anomaly score
        };

        // Data storage for pattern analysis
        this.dataHistory = {
            environmental: [],
            movement: [],
            combined: []
        };

        // Baseline statistics for each metric
        this.baselines = {
            weather_intensity: { mean: 0, std: 1, min: 0, max: 5 },
            crowd_density: { mean: 2, std: 1, min: 0, max: 5 },
            visibility: { mean: 0.8, std: 0.2, min: 0, max: 1 },
            temperature: { mean: 20, std: 10, min: -20, max: 50 },
            movement_speed: { mean: 0, std: 1, min: 0, max: 20 },
            location_change: { mean: 0, std: 0.1, min: 0, max: 1 },
            activity_level: { mean: 0.5, std: 0.3, min: 0, max: 1 }
        };

        // Anomaly detection results
        this.anomalyHistory = [];
        this.currentAnomalies = [];

        // Pattern recognition
        this.patterns = {
            seasonal: {},
            daily: {},
            trends: {}
        };
    }

    /**
     * Main anomaly detection function
     * @param {Object} currentData - Current environmental and movement data
     * @param {string} timestamp - ISO timestamp for the data point
     * @returns {Object} Anomaly detection results
     */
    detectAnomalies(currentData, timestamp = null) {
        try {
            const ts = timestamp || new Date().toISOString();
            
            // Validate input data
            this.validateInputData(currentData);

            // Normalize and extract metrics
            const metrics = this.extractMetrics(currentData, ts);

            // Store data point for pattern analysis
            this.storeDataPoint(metrics, ts);

            // Detect anomalies in different categories
            const environmentalAnomalies = this.detectEnvironmentalAnomalies(metrics);
            const movementAnomalies = this.detectMovementAnomalies(metrics);
            const patternAnomalies = this.detectPatternAnomalies(metrics, ts);
            const correlationAnomalies = this.detectCorrelationAnomalies(metrics);

            // Combine and score anomalies
            const allAnomalies = [
                ...environmentalAnomalies,
                ...movementAnomalies,
                ...patternAnomalies,
                ...correlationAnomalies
            ];

            // Calculate overall anomaly score
            const overallScore = this.calculateOverallAnomalyScore(allAnomalies);

            // Determine severity level
            const severity = this.determineSeverity(overallScore, allAnomalies);

            // Generate alerts and recommendations
            const alerts = this.generateAlerts(allAnomalies, severity);
            const recommendations = this.generateAnomalyRecommendations(allAnomalies, severity);

            // Update baselines if not anomalous
            if (severity.level !== 'CRITICAL' && severity.level !== 'HIGH') {
                this.updateBaselines(metrics);
            }

            // Create result object
            const result = {
                success: true,
                timestamp: ts,
                overall_anomaly_score: overallScore,
                severity: severity,
                anomalies_detected: allAnomalies,
                alerts: alerts,
                recommendations: recommendations,
                baseline_stats: this.getBaselineStats(),
                data_quality: this.assessDataQuality(metrics)
            };

            // Store anomaly result
            this.storeAnomalyResult(result);

            return result;

        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Validate input data structure
     */
    validateInputData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Input data must be a valid object');
        }

        // Check for required environmental fields
        const requiredFields = ['weather', 'location'];
        for (const field of requiredFields) {
            if (!data.hasOwnProperty(field)) {
                console.warn(`Missing recommended field: ${field}`);
            }
        }
    }

    /**
     * Extract and normalize metrics from raw data
     */
    extractMetrics(data, timestamp) {
        const metrics = {
            timestamp: timestamp,
            // Environmental metrics
            weather_intensity: this.quantifyWeather(data.weather),
            crowd_density: this.quantifyCrowdDensity(data.crowd_density),
            visibility: this.parseVisibility(data.visibility),
            temperature: this.parseTemperature(data.temperature),
            
            // Movement metrics
            movement_speed: this.calculateMovementSpeed(data.location, data.previous_location),
            location_change: this.calculateLocationChange(data.location, data.previous_location),
            activity_level: this.parseActivityLevel(data.activity_level),
            
            // Derived metrics
            environmental_stability: this.calculateEnvironmentalStability(data),
            risk_velocity: this.calculateRiskVelocity(data)
        };

        return metrics;
    }

    /**
     * Quantify weather conditions into numerical intensity
     */
    quantifyWeather(weather) {
        if (!weather) return 0;
        
        const weatherIntensity = {
            'clear': 0, 'sunny': 0, 'cloudy': 1, 'overcast': 1.5,
            'light_rain': 2, 'rainy': 3, 'heavy_rain': 4,
            'thunderstorm': 5, 'stormy': 5, 'foggy': 3,
            'snow': 3, 'blizzard': 5, 'tornado': 10, 'hurricane': 10
        };

        return weatherIntensity[weather.toLowerCase()] || 1;
    }

    /**
     * Quantify crowd density
     */
    quantifyCrowdDensity(crowdDensity) {
        if (!crowdDensity) return 2;
        
        const densityMap = {
            'isolated': 0, 'very_light': 1, 'light': 1.5,
            'moderate': 2.5, 'heavy': 3.5, 'very_heavy': 4,
            'overcrowded': 5, 'dangerous': 6
        };

        return densityMap[crowdDensity.toLowerCase()] || 2;
    }

    /**
     * Parse visibility value
     */
    parseVisibility(visibility) {
        if (typeof visibility === 'number') {
            return Math.max(0, Math.min(1, visibility));
        }
        
        const visibilityMap = {
            'excellent': 1.0, 'good': 0.8, 'fair': 0.6,
            'poor': 0.4, 'very_poor': 0.2, 'zero': 0.0
        };
        
        return visibilityMap[visibility?.toLowerCase()] || 0.8;
    }

    /**
     * Parse temperature value
     */
    parseTemperature(temperature) {
        if (typeof temperature === 'number') return temperature;
        
        // Extract number from string if possible
        const match = temperature?.toString().match(/-?\d+\.?\d*/);
        return match ? parseFloat(match[0]) : 20; // Default to 20°C
    }

    /**
     * Calculate movement speed between locations
     */
    calculateMovementSpeed(currentLocation, previousLocation) {
        if (!currentLocation || !previousLocation) return 0;
        
        // Simple distance calculation (would use proper geolocation in real implementation)
        const distance = this.calculateDistance(currentLocation, previousLocation);
        const timeInterval = 1; // Assume 1 unit time interval
        
        return distance / timeInterval;
    }

    /**
     * Calculate location change magnitude
     */
    calculateLocationChange(currentLocation, previousLocation) {
        if (!currentLocation || !previousLocation) return 0;
        
        return this.calculateDistance(currentLocation, previousLocation);
    }

    /**
     * Simple distance calculation (placeholder for real geolocation)
     */
    calculateDistance(loc1, loc2) {
        // In real implementation, would use proper geolocation formulas
        if (typeof loc1 === 'string' && typeof loc2 === 'string') {
            return loc1 === loc2 ? 0 : 0.1; // Simple string comparison
        }
        
        // If coordinates are provided
        if (loc1.lat && loc1.lon && loc2.lat && loc2.lon) {
            const dlat = loc1.lat - loc2.lat;
            const dlon = loc1.lon - loc2.lon;
            return Math.sqrt(dlat * dlat + dlon * dlon);
        }
        
        return 0;
    }

    /**
     * Parse activity level
     */
    parseActivityLevel(activityLevel) {
        if (typeof activityLevel === 'number') {
            return Math.max(0, Math.min(1, activityLevel));
        }
        
        const activityMap = {
            'stationary': 0.0, 'low': 0.2, 'moderate': 0.5,
            'high': 0.8, 'very_high': 1.0
        };
        
        return activityMap[activityLevel?.toLowerCase()] || 0.5;
    }

    /**
     * Calculate environmental stability
     */
    calculateEnvironmentalStability(data) {
        // Measure how stable environmental conditions are
        const recentData = this.dataHistory.environmental.slice(-5);
        if (recentData.length < 2) return 1.0;
        
        let totalVariation = 0;
        let count = 0;
        
        for (let i = 1; i < recentData.length; i++) {
            const prev = recentData[i - 1];
            const curr = recentData[i];
            
            totalVariation += Math.abs(curr.weather_intensity - prev.weather_intensity);
            totalVariation += Math.abs(curr.crowd_density - prev.crowd_density);
            totalVariation += Math.abs(curr.visibility - prev.visibility);
            count += 3;
        }
        
        const avgVariation = count > 0 ? totalVariation / count : 0;
        return Math.max(0, 1 - avgVariation); // Higher value = more stable
    }

    /**
     * Calculate risk velocity (rate of risk change)
     */
    calculateRiskVelocity(data) {
        const recentData = this.dataHistory.combined.slice(-3);
        if (recentData.length < 2) return 0;
        
        // Simple risk calculation for velocity
        const currentRisk = this.calculateSimpleRisk(data);
        const previousRisk = recentData[recentData.length - 1].simple_risk || 0;
        
        return currentRisk - previousRisk;
    }

    /**
     * Simple risk calculation for velocity measurement
     */
    calculateSimpleRisk(data) {
        const weatherRisk = this.quantifyWeather(data.weather) * 0.3;
        const crowdRisk = this.quantifyCrowdDensity(data.crowd_density) * 0.3;
        const visibilityRisk = (1 - this.parseVisibility(data.visibility)) * 0.2;
        const timeRisk = this.getTimeRisk() * 0.2;
        
        return weatherRisk + crowdRisk + visibilityRisk + timeRisk;
    }

    /**
     * Get time-based risk factor
     */
    getTimeRisk() {
        const hour = new Date().getHours();
        if (hour >= 22 || hour <= 5) return 2; // Night
        if (hour >= 18 || hour <= 7) return 1; // Evening/Early morning
        return 0; // Day
    }

    /**
     * Store data point for pattern analysis
     */
    storeDataPoint(metrics, timestamp) {
        // Store in appropriate categories
        this.dataHistory.environmental.push({
            timestamp: timestamp,
            weather_intensity: metrics.weather_intensity,
            crowd_density: metrics.crowd_density,
            visibility: metrics.visibility,
            temperature: metrics.temperature
        });

        this.dataHistory.movement.push({
            timestamp: timestamp,
            movement_speed: metrics.movement_speed,
            location_change: metrics.location_change,
            activity_level: metrics.activity_level
        });

        this.dataHistory.combined.push({
            timestamp: timestamp,
            ...metrics
        });

        // Maintain window size
        const maxSize = this.config.windowSize * 2;
        if (this.dataHistory.environmental.length > maxSize) {
            this.dataHistory.environmental = this.dataHistory.environmental.slice(-maxSize);
        }
        if (this.dataHistory.movement.length > maxSize) {
            this.dataHistory.movement = this.dataHistory.movement.slice(-maxSize);
        }
        if (this.dataHistory.combined.length > maxSize) {
            this.dataHistory.combined = this.dataHistory.combined.slice(-maxSize);
        }
    }

    /**
     * Detect environmental anomalies
     */
    detectEnvironmentalAnomalies(metrics) {
        const anomalies = [];
        
        // Check each environmental metric
        const envMetrics = ['weather_intensity', 'crowd_density', 'visibility', 'temperature'];
        
        for (const metric of envMetrics) {
            const value = metrics[metric];
            const baseline = this.baselines[metric];
            
            if (baseline && this.dataHistory.environmental.length >= this.config.minDataPoints) {
                const zScore = Math.abs((value - baseline.mean) / baseline.std);
                
                if (zScore > this.config.sensitivityThreshold) {
                    anomalies.push({
                        type: 'environmental',
                        metric: metric,
                        value: value,
                        expected_range: [
                            baseline.mean - baseline.std * 2,
                            baseline.mean + baseline.std * 2
                        ],
                        z_score: zScore,
                        severity: this.classifyAnomalySeverity(zScore),
                        description: `${metric} value ${value} deviates significantly from baseline`
                    });
                }
            }
        }

        return anomalies;
    }

    /**
     * Detect movement anomalies
     */
    detectMovementAnomalies(metrics) {
        const anomalies = [];
        
        // Check movement metrics
        const movementMetrics = ['movement_speed', 'location_change', 'activity_level'];
        
        for (const metric of movementMetrics) {
            const value = metrics[metric];
            const baseline = this.baselines[metric];
            
            if (baseline && this.dataHistory.movement.length >= this.config.minDataPoints) {
                const zScore = Math.abs((value - baseline.mean) / baseline.std);
                
                if (zScore > this.config.sensitivityThreshold) {
                    anomalies.push({
                        type: 'movement',
                        metric: metric,
                        value: value,
                        expected_range: [
                            baseline.mean - baseline.std * 2,
                            baseline.mean + baseline.std * 2
                        ],
                        z_score: zScore,
                        severity: this.classifyAnomalySeverity(zScore),
                        description: `${metric} value ${value} shows unusual pattern`
                    });
                }
            }
        }

        // Detect sudden movement changes
        if (this.dataHistory.movement.length >= 2) {
            const recent = this.dataHistory.movement.slice(-2);
            const speedChange = Math.abs(recent[1].movement_speed - recent[0].movement_speed);
            
            if (speedChange > 5) { // Threshold for sudden speed change
                anomalies.push({
                    type: 'movement',
                    metric: 'speed_change',
                    value: speedChange,
                    severity: 'MEDIUM',
                    description: `Sudden movement speed change detected: ${speedChange.toFixed(2)}`
                });
            }
        }

        return anomalies;
    }

    /**
     * Detect pattern anomalies (temporal patterns)
     */
    detectPatternAnomalies(metrics, timestamp) {
        const anomalies = [];
        const date = new Date(timestamp);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();

        // Check for unusual activity at unusual times
        if ((hour >= 2 && hour <= 5) && metrics.activity_level > 0.7) {
            anomalies.push({
                type: 'pattern',
                metric: 'unusual_time_activity',
                value: metrics.activity_level,
                severity: 'MEDIUM',
                description: `High activity level (${metrics.activity_level}) detected during late night hours`
            });
        }

        // Check for unusual crowd patterns
        if (this.isWeekend(dayOfWeek) && hour < 8 && metrics.crowd_density > 3) {
            anomalies.push({
                type: 'pattern',
                metric: 'unusual_crowd_timing',
                value: metrics.crowd_density,
                severity: 'MEDIUM',
                description: `Unexpected crowd density during weekend early hours`
            });
        }

        // Check environmental stability
        if (metrics.environmental_stability < 0.3) {
            anomalies.push({
                type: 'pattern',
                metric: 'environmental_instability',
                value: metrics.environmental_stability,
                severity: 'HIGH',
                description: `Environmental conditions are highly unstable`
            });
        }

        return anomalies;
    }

    /**
     * Detect correlation anomalies (unusual relationships between metrics)
     */
    detectCorrelationAnomalies(metrics) {
        const anomalies = [];

        // Check for unusual correlations
        
        // High visibility with severe weather (unusual)
        if (metrics.weather_intensity >= 4 && metrics.visibility > 0.8) {
            anomalies.push({
                type: 'correlation',
                metric: 'weather_visibility_mismatch',
                value: { weather: metrics.weather_intensity, visibility: metrics.visibility },
                severity: 'MEDIUM',
                description: `High visibility during severe weather conditions is unusual`
            });
        }

        // High movement during poor visibility
        if (metrics.visibility < 0.3 && metrics.movement_speed > 2) {
            anomalies.push({
                type: 'correlation',
                metric: 'movement_visibility_risk',
                value: { movement: metrics.movement_speed, visibility: metrics.visibility },
                severity: 'HIGH',
                description: `High movement speed during poor visibility conditions`
            });
        }

        // Rapid risk increase
        if (metrics.risk_velocity > 2) {
            anomalies.push({
                type: 'correlation',
                metric: 'rapid_risk_increase',
                value: metrics.risk_velocity,
                severity: 'HIGH',
                description: `Rapid increase in risk conditions detected`
            });
        }

        return anomalies;
    }

    /**
     * Classify anomaly severity based on z-score
     */
    classifyAnomalySeverity(zScore) {
        if (zScore > 4) return 'CRITICAL';
        if (zScore > 3.5) return 'HIGH';
        if (zScore > 2.5) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Calculate overall anomaly score
     */
    calculateOverallAnomalyScore(anomalies) {
        if (anomalies.length === 0) return 0;

        const severityWeights = {
            'LOW': 1,
            'MEDIUM': 2,
            'HIGH': 4,
            'CRITICAL': 8
        };

        let totalScore = 0;
        for (const anomaly of anomalies) {
            const weight = severityWeights[anomaly.severity] || 1;
            const zScore = anomaly.z_score || 2;
            totalScore += weight * Math.min(zScore, 5); // Cap individual contributions
        }

        return Math.min(totalScore, this.config.maxAnomalyScore);
    }

    /**
     * Determine overall severity level
     */
    determineSeverity(overallScore, anomalies) {
        const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
        const highCount = anomalies.filter(a => a.severity === 'HIGH').length;

        if (criticalCount > 0 || overallScore >= 8) {
            return {
                level: 'CRITICAL',
                score: overallScore,
                description: 'Critical anomalies detected - immediate attention required'
            };
        } else if (highCount > 1 || overallScore >= 6) {
            return {
                level: 'HIGH',
                score: overallScore,
                description: 'High severity anomalies detected'
            };
        } else if (overallScore >= 3) {
            return {
                level: 'MEDIUM',
                score: overallScore,
                description: 'Moderate anomalies detected'
            };
        } else if (overallScore > 0) {
            return {
                level: 'LOW',
                score: overallScore,
                description: 'Minor anomalies detected'
            };
        } else {
            return {
                level: 'NORMAL',
                score: 0,
                description: 'No significant anomalies detected'
            };
        }
    }

    /**
     * Generate alerts based on anomalies
     */
    generateAlerts(anomalies, severity) {
        const alerts = [];

        if (severity.level === 'CRITICAL') {
            alerts.push({
                type: 'EMERGENCY',
                message: 'CRITICAL ANOMALY DETECTED - Take immediate safety action',
                priority: 1
            });
        }

        // Type-specific alerts
        const environmentalAnomalies = anomalies.filter(a => a.type === 'environmental');
        const movementAnomalies = anomalies.filter(a => a.type === 'movement');
        const patternAnomalies = anomalies.filter(a => a.type === 'pattern');

        if (environmentalAnomalies.length > 0) {
            alerts.push({
                type: 'ENVIRONMENTAL',
                message: `Environmental conditions showing unusual patterns (${environmentalAnomalies.length} anomalies)`,
                priority: 2
            });
        }

        if (movementAnomalies.length > 0) {
            alerts.push({
                type: 'MOVEMENT',
                message: `Unusual movement patterns detected (${movementAnomalies.length} anomalies)`,
                priority: 2
            });
        }

        if (patternAnomalies.length > 0) {
            alerts.push({
                type: 'PATTERN',
                message: `Temporal or behavioral patterns are abnormal`,
                priority: 3
            });
        }

        return alerts;
    }

    /**
     * Generate anomaly-specific recommendations
     */
    generateAnomalyRecommendations(anomalies, severity) {
        const recommendations = [];

        if (severity.level === 'CRITICAL') {
            recommendations.push('IMMEDIATE ACTION: Assess your safety and consider evacuation');
            recommendations.push('Contact emergency services if in immediate danger');
        }

        // Specific recommendations based on anomaly types
        for (const anomaly of anomalies) {
            switch (anomaly.metric) {
                case 'weather_intensity':
                    if (anomaly.value > anomaly.expected_range[1]) {
                        recommendations.push('Severe weather detected - seek immediate shelter');
                    }
                    break;
                case 'movement_speed':
                    if (anomaly.value > anomaly.expected_range[1]) {
                        recommendations.push('Unusually high movement detected - verify safety of rapid movement');
                    }
                    break;
                case 'visibility':
                    if (anomaly.value < anomaly.expected_range[0]) {
                        recommendations.push('Extremely poor visibility - stop movement and wait for improvement');
                    }
                    break;
                case 'environmental_instability':
                    recommendations.push('Environmental conditions are rapidly changing - monitor closely');
                    break;
                case 'rapid_risk_increase':
                    recommendations.push('Risk conditions escalating quickly - prepare for emergency action');
                    break;
            }
        }

        // General recommendations
        if (anomalies.length > 3) {
            recommendations.push('Multiple anomalies detected - exercise extreme caution');
        }

        if (recommendations.length === 0) {
            recommendations.push('Monitor conditions closely for further anomalies');
        }

        return [...new Set(recommendations)]; // Remove duplicates
    }

    /**
     * Update baseline statistics with new data
     */
    updateBaselines(metrics) {
        for (const [metric, value] of Object.entries(metrics)) {
            if (this.baselines[metric] && typeof value === 'number') {
                const baseline = this.baselines[metric];
                const alpha = 0.1; // Learning rate for baseline updates
                
                // Update mean with exponential moving average
                baseline.mean = baseline.mean * (1 - alpha) + value * alpha;
                
                // Update standard deviation
                const variance = Math.pow(value - baseline.mean, 2);
                baseline.std = Math.sqrt(baseline.std * baseline.std * (1 - alpha) + variance * alpha);
                
                // Update min/max
                baseline.min = Math.min(baseline.min, value);
                baseline.max = Math.max(baseline.max, value);
            }
        }
    }

    /**
     * Utility functions
     */
    isWeekend(dayOfWeek) {
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }

    getBaselineStats() {
        return JSON.parse(JSON.stringify(this.baselines));
    }

    assessDataQuality(metrics) {
        let quality = 1.0;
        let issues = [];

        // Check for missing values
        const expectedMetrics = Object.keys(this.baselines);
        for (const metric of expectedMetrics) {
            if (metrics[metric] === undefined || metrics[metric] === null) {
                quality -= 0.1;
                issues.push(`Missing ${metric}`);
            }
        }

        // Check for out-of-range values
        for (const [metric, value] of Object.entries(metrics)) {
            if (this.baselines[metric] && typeof value === 'number') {
                const baseline = this.baselines[metric];
                if (value < baseline.min || value > baseline.max) {
                    quality -= 0.05;
                    issues.push(`${metric} out of expected range`);
                }
            }
        }

        return {
            score: Math.max(0, quality),
            issues: issues
        };
    }

    storeAnomalyResult(result) {
        this.anomalyHistory.push(result);
        
        // Keep only recent results
        if (this.anomalyHistory.length > 100) {
            this.anomalyHistory = this.anomalyHistory.slice(-100);
        }

        // Update current anomalies
        this.currentAnomalies = result.anomalies_detected;
    }

    /**
     * Get system status and statistics
     */
    getSystemStatus() {
        return {
            data_points_collected: this.dataHistory.combined.length,
            anomalies_detected_total: this.anomalyHistory.length,
            current_anomalies: this.currentAnomalies.length,
            baseline_stats: this.getBaselineStats(),
            configuration: this.config,
            last_update: this.dataHistory.combined.length > 0 ? 
                this.dataHistory.combined[this.dataHistory.combined.length - 1].timestamp : null
        };
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnomalyDetector;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.AnomalyDetector = AnomalyDetector;
}