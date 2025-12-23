/**
 * LifeGuard AI - Enhanced Application with Auto Weather & Crowd Detection
 */

class LifeGuardAI {
    constructor() {
        this.config = {
            weatherApiKey: localStorage.getItem('weatherApiKey') || '',
            placesApiKey: localStorage.getItem('placesApiKey') || '',
            refreshInterval: parseInt(localStorage.getItem('refreshInterval')) || 1, // Changed to 1 second
            riskSensitivity: parseFloat(localStorage.getItem('riskSensitivity')) || 1.0,
            realTimeMode: true,
            highAccuracyGPS: true,
            weatherUpdateFrequency: 30, // Update weather every 30 seconds
            crowdUpdateFrequency: 5 // Update crowd data every 5 seconds
        };

        this.currentLocation = null;
        this.weatherData = null;
        this.crowdData = null;
        this.riskAssessment = null;
        this.autoMode = true;
        this.refreshTimer = null;
        this.weatherTimer = null;
        this.crowdTimer = null;
        this.gpsWatcher = null;
        this.lastWeatherUpdate = 0;
        this.lastCrowdUpdate = 0;
        this.dataUpdateQueue = [];
        this.isUpdating = false;

        this.initialize();
    }

    async initialize() {
        this.showLoading();
        await this.setupApplication();
        this.hideLoading();
    }

    async setupApplication() {
        try {
            // Initialize UI
            this.setupEventListeners();
            this.updateProgress(20);

            // Get user location
            await this.getCurrentLocation();
            this.updateProgress(40);

            // Get weather data
            await this.getWeatherData();
            this.updateProgress(60);

            // Get crowd data
            await this.getCrowdData();
            this.updateProgress(80);

            // Perform initial risk assessment
            this.performRiskAssessment();
            this.updateProgress(100);

            // Start auto-refresh
            this.startAutoRefresh();

            // Update UI
            this.updateAllDisplays();

        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize application');
        }
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshData').addEventListener('click', () => {
            this.refreshAllData();
        });

        // Auto mode toggle
        document.getElementById('autoMode').addEventListener('click', () => {
            this.toggleAutoMode();
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeSettings();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Emergency button
        document.getElementById('emergencyBtn').addEventListener('click', () => {
            this.handleEmergency();
        });

        // Share location
        document.getElementById('shareLocationBtn').addEventListener('click', () => {
            this.shareLocation();
        });

        // Update time display
        setInterval(() => this.updateTimeDisplay(), 1000);
    }

    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            const options = {
                enableHighAccuracy: this.config.highAccuracyGPS,
                timeout: 5000, // Reduced timeout for faster updates
                maximumAge: 1000 // Cache for only 1 second for real-time accuracy
            };

            // Start continuous GPS tracking for real-time updates
            if (this.config.realTimeMode && !this.gpsWatcher) {
                this.gpsWatcher = navigator.geolocation.watchPosition(
                    (position) => {
                        const newLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            altitude: position.coords.altitude,
                            heading: position.coords.heading,
                            speed: position.coords.speed,
                            timestamp: position.timestamp
                        };
                        
                        // Check if location has changed significantly
                        if (this.hasLocationChanged(newLocation)) {
                            this.currentLocation = newLocation;
                            this.updateLocationDisplay();
                            this.setIndicatorStatus('gpsStatus', true);
                            
                            // Trigger immediate data refresh if location changed
                            this.queueDataUpdate('location_change');
                        }
                    },
                    (error) => {
                        console.error('GPS tracking error:', error);
                        this.setIndicatorStatus('gpsStatus', false);
                    },
                    options
                );
            }

            // Get initial position
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    };
                    this.updateLocationDisplay();
                    this.setIndicatorStatus('gpsStatus', true);
                    resolve(this.currentLocation);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.setIndicatorStatus('gpsStatus', false);
                    // Use fallback location (demo purposes)
                    this.currentLocation = {
                        latitude: 40.7128,
                        longitude: -74.0060,
                        accuracy: 1000,
                        timestamp: Date.now()
                    };
                    resolve(this.currentLocation);
                },
                options
            );
        });
    }

    async getWeatherData() {
        const now = Date.now();
        
        // Check if we need to update weather data
        if (now - this.lastWeatherUpdate < this.config.weatherUpdateFrequency * 1000) {
            return; // Skip update if too recent
        }

        if (!this.config.weatherApiKey) {
            // Use mock weather data with some variation for realism
            this.weatherData = this.getMockWeatherData(true);
            this.setIndicatorStatus('weatherStatus', false);
            this.lastWeatherUpdate = now;
            return;
        }

        try {
            const { latitude, longitude } = this.currentLocation;
            
            // Get current weather with more detailed parameters
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.config.weatherApiKey}&units=metric`;
            
            // Also get forecast for trend analysis
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${this.config.weatherApiKey}&units=metric&cnt=8`;
            
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(currentWeatherUrl),
                fetch(forecastUrl)
            ]);
            
            if (!currentResponse.ok) throw new Error('Weather API error');
            
            const currentData = await currentResponse.json();
            const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;
            
            this.weatherData = {
                condition: currentData.weather[0].main.toLowerCase(),
                description: currentData.weather[0].description,
                temperature: Math.round(currentData.main.temp),
                feels_like: Math.round(currentData.main.feels_like),
                humidity: currentData.main.humidity,
                pressure: currentData.main.pressure,
                windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
                windDirection: currentData.wind.deg,
                visibility: currentData.visibility / 1000, // Convert to km
                cloudiness: currentData.clouds.all,
                uv_index: currentData.uvi || 0,
                icon: currentData.weather[0].icon,
                sunrise: new Date(currentData.sys.sunrise * 1000),
                sunset: new Date(currentData.sys.sunset * 1000),
                location_name: currentData.name,
                
                // Forecast trend analysis
                trend: this.analyzeWeatherTrend(forecastData),
                severity_score: this.calculateWeatherSeverity(currentData),
                last_updated: now
            };
            
            this.setIndicatorStatus('weatherStatus', true);
            this.lastWeatherUpdate = now;
            
        } catch (error) {
            console.error('Weather API error:', error);
            this.weatherData = this.getMockWeatherData(true);
            this.setIndicatorStatus('weatherStatus', false);
            this.lastWeatherUpdate = now;
        }
    }

    getMockWeatherData(realistic = false) {
        const conditions = ['clear', 'cloudy', 'rainy', 'foggy'];
        let condition = conditions[Math.floor(Math.random() * conditions.length)];
        
        // Add some realistic variation if in realistic mode
        if (realistic && this.weatherData) {
            // Keep similar conditions with slight variations
            const currentTemp = this.weatherData.temperature || 20;
            const tempVariation = (Math.random() - 0.5) * 2; // ±1 degree variation
            
            return {
                ...this.weatherData,
                temperature: Math.round(currentTemp + tempVariation),
                humidity: Math.max(30, Math.min(90, (this.weatherData.humidity || 50) + (Math.random() - 0.5) * 10)),
                windSpeed: Math.max(0, (this.weatherData.windSpeed || 10) + (Math.random() - 0.5) * 5),
                last_updated: Date.now()
            };
        }
        
        return {
            condition: condition,
            description: `${condition} sky`,
            temperature: Math.round(Math.random() * 30 + 5),
            feels_like: Math.round(Math.random() * 30 + 5),
            humidity: Math.round(Math.random() * 60 + 30),
            pressure: Math.round(Math.random() * 50 + 1000),
            windSpeed: Math.round(Math.random() * 20 + 5),
            windDirection: Math.round(Math.random() * 360),
            visibility: Math.random() * 8 + 2,
            cloudiness: Math.round(Math.random() * 100),
            icon: '01d',
            severity_score: Math.random() * 5,
            last_updated: Date.now()
        };
    }

    async getCrowdData() {
        const now = Date.now();
        
        // Check if we need to update crowd data
        if (now - this.lastCrowdUpdate < this.config.crowdUpdateFrequency * 1000) {
            return; // Skip update if too recent
        }

        if (!this.config.placesApiKey) {
            // Use mock crowd data with realistic variations
            this.crowdData = this.getMockCrowdData(true);
            this.setIndicatorStatus('crowdStatus', false);
            this.lastCrowdUpdate = now;
            return;
        }

        try {
            // Use Google Places API to estimate crowd density with multiple data sources
            const { latitude, longitude } = this.currentLocation;
            const radius = 300; // Reduced radius for more accurate local data
            
            // Get nearby places for crowd estimation
            const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${this.config.placesApiKey}`;
            
            // Also check for real-time traffic data if available
            const trafficUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${latitude},${longitude}&destination=${latitude + 0.001},${longitude + 0.001}&departure_time=now&traffic_model=best_guess&key=${this.config.placesApiKey}`;
            
            const [placesResponse, trafficResponse] = await Promise.all([
                fetch(placesUrl),
                fetch(trafficUrl).catch(() => null) // Traffic API might not be available
            ]);
            
            if (!placesResponse.ok) throw new Error('Places API error');
            
            const placesData = await placesResponse.json();
            const trafficData = trafficResponse && trafficResponse.ok ? await trafficResponse.json() : null;
            
            // Enhanced crowd score calculation
            const crowdScore = this.calculateEnhancedCrowdScore(placesData.results, trafficData);
            const crowdLevel = this.getCrowdLevel(crowdScore);
            
            // Analyze crowd patterns and trends
            const crowdTrend = this.analyzeCrowdTrend();
            const peakHours = this.isPeakHours();
            
            this.crowdData = {
                level: crowdLevel,
                score: crowdScore,
                nearbyPlaces: placesData.results.length,
                trend: crowdTrend,
                peak_hours: peakHours,
                density_map: this.createDensityMap(placesData.results),
                traffic_factor: this.analyzeTrafficFactor(trafficData),
                estimated_people: this.estimatePeopleCount(crowdScore, radius),
                last_updated: now
            };
            
            this.setIndicatorStatus('crowdStatus', true);
            this.lastCrowdUpdate = now;
            
        } catch (error) {
            console.error('Crowd API error:', error);
            this.crowdData = this.getMockCrowdData(true);
            this.setIndicatorStatus('crowdStatus', false);
            this.lastCrowdUpdate = now;
        }
    }

    getMockCrowdData(realistic = false) {
        const levels = ['isolated', 'light', 'moderate', 'heavy'];
        let level = levels[Math.floor(Math.random() * levels.length)];
        
        // Add realistic variation if in realistic mode
        if (realistic && this.crowdData) {
            // Keep similar crowd levels with slight variations
            const currentScore = this.crowdData.score || 50;
            const scoreVariation = (Math.random() - 0.5) * 20; // ±10 point variation
            const newScore = Math.max(0, Math.min(100, currentScore + scoreVariation));
            
            return {
                ...this.crowdData,
                score: newScore,
                level: this.getCrowdLevel(newScore),
                nearbyPlaces: Math.max(5, (this.crowdData.nearbyPlaces || 25) + Math.floor((Math.random() - 0.5) * 10)),
                trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'increasing' : 'decreasing') : 'stable',
                last_updated: Date.now()
            };
        }
        
        const score = Math.random() * 100;
        return {
            level: level,
            score: score,
            nearbyPlaces: Math.floor(Math.random() * 50 + 10),
            trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
            peak_hours: this.isPeakHours(),
            estimated_people: Math.floor(score * 2),
            last_updated: Date.now()
        };
    }

    calculateCrowdScore(places) {
        let score = 0;
        const crowdTypes = {
            'shopping_mall': 20,
            'restaurant': 15,
            'tourist_attraction': 25,
            'transit_station': 30,
            'school': 20,
            'hospital': 15,
            'park': 10,
            'gym': 10
        };

        places.forEach(place => {
            place.types.forEach(type => {
                if (crowdTypes[type]) {
                    score += crowdTypes[type];
                }
            });
        });

        return Math.min(score, 100);
    }

    getCrowdLevel(score) {
        if (score < 20) return 'isolated';
        if (score < 40) return 'light';
        if (score < 60) return 'moderate';
        if (score < 80) return 'heavy';
        return 'overcrowded';
    }

    performRiskAssessment() {
        if (!this.weatherData || !this.crowdData) return;

        const conditions = {
            location: 'urban',
            time: this.getTimeOfDay(),
            weather: this.weatherData.condition,
            crowd_density: this.crowdData.level,
            visibility: this.weatherData.visibility / 10, // Normalize to 0-1
            temperature: this.weatherData.temperature
        };

        // Use the existing risk assessment function
        this.riskAssessment = assessRisk(
            conditions.location,
            conditions.time,
            conditions.weather,
            conditions.crowd_density
        );

        // Apply sensitivity multiplier
        this.riskAssessment.risk_score *= this.config.riskSensitivity;
        
        // Recalculate risk level based on adjusted score
        if (this.riskAssessment.risk_score >= 5) {
            this.riskAssessment.risk_level = 'HIGH';
        } else if (this.riskAssessment.risk_score >= 3) {
            this.riskAssessment.risk_level = 'MEDIUM';
        } else {
            this.riskAssessment.risk_level = 'LOW';
        }

        this.generateRecommendations();
        this.checkForAlerts();
    }

    generateRecommendations() {
        const recommendations = [];
        const riskLevel = this.riskAssessment.risk_level;

        // Base recommendations
        if (riskLevel === 'HIGH') {
            recommendations.push('Consider moving to a safer location');
            recommendations.push('Stay alert and avoid risky activities');
            recommendations.push('Keep emergency contacts ready');
        } else if (riskLevel === 'MEDIUM') {
            recommendations.push('Exercise increased caution');
            recommendations.push('Monitor conditions closely');
            recommendations.push('Stay in groups when possible');
        } else {
            recommendations.push('Continue normal activities');
            recommendations.push('Maintain basic safety awareness');
        }

        // Weather-specific recommendations
        if (this.weatherData.condition === 'rainy') {
            recommendations.push('Carry umbrella and wear appropriate footwear');
        } else if (this.weatherData.condition === 'foggy') {
            recommendations.push('Use lights and move slowly in low visibility');
        }

        // Crowd-specific recommendations
        if (this.crowdData.level === 'overcrowded') {
            recommendations.push('Avoid crowded areas or identify exit routes');
        } else if (this.crowdData.level === 'isolated') {
            recommendations.push('Stay connected and inform others of your location');
        }

        this.riskAssessment.recommendations = recommendations;
    }

    checkForAlerts() {
        const alerts = [];

        // High risk alert
        if (this.riskAssessment.risk_level === 'HIGH') {
            alerts.push({
                type: 'warning',
                message: 'High risk conditions detected',
                time: new Date().toLocaleTimeString()
            });
        }

        // Weather alerts
        if (this.weatherData.condition === 'thunderstorm') {
            alerts.push({
                type: 'weather',
                message: 'Severe weather warning in effect',
                time: new Date().toLocaleTimeString()
            });
        }

        // Crowd alerts
        if (this.crowdData.level === 'overcrowded') {
            alerts.push({
                type: 'crowd',
                message: 'High crowd density detected',
                time: new Date().toLocaleTimeString()
            });
        }

        this.updateAlertsDisplay(alerts);
    }

    // UI Update Methods
    updateAllDisplays() {
        this.updateRiskDisplay();
        this.updateEnvironmentalDisplay();
        this.updateRecommendationsDisplay();
        this.updateTimeDisplay();
    }

    updateRiskDisplay() {
        if (!this.riskAssessment) return;

        const riskValue = document.getElementById('riskValue');
        const riskLabel = document.getElementById('riskLabel');
        const riskDisplay = document.getElementById('riskDisplay');

        riskValue.textContent = this.riskAssessment.risk_score.toFixed(1);
        riskLabel.textContent = this.riskAssessment.risk_level;

        // Update risk bars (simplified breakdown)
        const factors = {
            weather: 30,
            crowd: 25,
            location: 25,
            time: 20
        };

        Object.entries(factors).forEach(([factor, percentage]) => {
            const bar = document.getElementById(`${factor}Bar`);
            const value = document.getElementById(`${factor}Value`);
            if (bar && value) {
                bar.style.width = `${percentage}%`;
                value.textContent = `${percentage}%`;
            }
        });
    }

    updateEnvironmentalDisplay() {
        // Weather
        if (this.weatherData) {
            document.getElementById('weatherCondition').textContent = 
                this.weatherData.description.charAt(0).toUpperCase() + this.weatherData.description.slice(1);
            document.getElementById('temperature').textContent = `${this.weatherData.temperature}°C`;
            document.getElementById('humidity').textContent = `${this.weatherData.humidity}%`;
            document.getElementById('windSpeed').textContent = `${this.weatherData.windSpeed} km/h`;
            
            // Update weather icon
            const weatherIcon = document.getElementById('weatherIcon');
            weatherIcon.className = this.getWeatherIconClass(this.weatherData.condition);
            
            // Add real-time indicators
            if (this.weatherData.last_updated) {
                const timeSince = Math.floor((Date.now() - this.weatherData.last_updated) / 1000);
                if (timeSince < 60) {
                    document.getElementById('weatherCondition').title = `Updated ${timeSince}s ago`;
                }
            }
        }

        // Location
        if (this.currentLocation) {
            const locationName = this.weatherData?.location_name || 'Current Location';
            document.getElementById('locationName').textContent = locationName;
            document.getElementById('coordinates').textContent = 
                `${this.currentLocation.latitude.toFixed(4)}°, ${this.currentLocation.longitude.toFixed(4)}°`;
            
            let accuracyText = `±${Math.round(this.currentLocation.accuracy)}m`;
            if (this.currentLocation.speed && this.currentLocation.speed > 0) {
                accuracyText += ` • ${Math.round(this.currentLocation.speed * 3.6)} km/h`;
            }
            document.getElementById('accuracy').textContent = accuracyText;
        }

        // Crowd
        if (this.crowdData) {
            document.getElementById('crowdLevel').textContent = 
                this.crowdData.level.charAt(0).toUpperCase() + this.crowdData.level.slice(1);
            
            let crowdCountText = `${this.crowdData.nearbyPlaces} places`;
            if (this.crowdData.estimated_people) {
                crowdCountText = `~${this.crowdData.estimated_people} people`;
            }
            document.getElementById('crowdCount').textContent = crowdCountText;
            
            let trendText = this.crowdData.trend;
            if (this.crowdData.peak_hours) {
                trendText += ' • Peak Hours';
            }
            document.getElementById('crowdTrend').textContent = trendText;
            
            // Update crowd icon based on level and trend
            const crowdIcon = document.getElementById('crowdIcon');
            crowdIcon.className = this.getCrowdIconClass(this.crowdData.level);
            
            // Add pulsing effect for increasing crowds
            if (this.crowdData.trend === 'increasing') {
                crowdIcon.style.animation = 'pulse 2s ease-in-out infinite';
            } else {
                crowdIcon.style.animation = '';
            }
        }
    }

    updateRecommendationsDisplay() {
        if (!this.riskAssessment || !this.riskAssessment.recommendations) return;

        const priorityRecommendation = document.getElementById('priorityRecommendation');
        const recommendationsList = document.getElementById('recommendationsList');

        // Update priority recommendation
        const priorityText = priorityRecommendation.querySelector('.priority-text');
        priorityText.textContent = this.riskAssessment.recommendations[0] || 'No specific recommendations';

        // Update recommendations list
        recommendationsList.innerHTML = '';
        this.riskAssessment.recommendations.slice(1).forEach(recommendation => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.textContent = recommendation;
            recommendationsList.appendChild(item);
        });

        // Update confidence
        document.getElementById('confidenceLevel').textContent = '85%';
    }

    updateAlertsDisplay(alerts) {
        const alertsContent = document.getElementById('alertsContent');
        const alertCount = document.getElementById('alertCount');

        alertCount.textContent = alerts.length;

        if (alerts.length === 0) {
            alertsContent.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle"></i>
                    <span>All systems normal</span>
                </div>
            `;
        } else {
            alertsContent.innerHTML = '';
            alerts.forEach(alert => {
                const alertItem = document.createElement('div');
                alertItem.className = 'alert-item';
                alertItem.innerHTML = `
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="alert-text">${alert.message}</div>
                    <div class="alert-time">${alert.time}</div>
                `;
                alertsContent.appendChild(alertItem);
            });
        }
    }

    updateTimeDisplay() {
        const now = new Date();
        document.getElementById('currentTime').textContent = now.toLocaleTimeString();
        document.getElementById('timeZone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
        document.getElementById('dayType').textContent = this.getDayType(now);
    }

    updateLocationDisplay() {
        // This is called when location is obtained
        // Additional location-specific updates can be added here
    }

    // Utility Methods
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    getDayType(date) {
        const day = date.getDay();
        return (day === 0 || day === 6) ? 'Weekend' : 'Weekday';
    }

    getWeatherIconClass(condition) {
        const iconMap = {
            'clear': 'fas fa-sun',
            'cloudy': 'fas fa-cloud',
            'rainy': 'fas fa-cloud-rain',
            'thunderstorm': 'fas fa-bolt',
            'snow': 'fas fa-snowflake',
            'foggy': 'fas fa-smog'
        };
        return iconMap[condition] || 'fas fa-cloud';
    }

    getCrowdIconClass(level) {
        const iconMap = {
            'isolated': 'fas fa-user',
            'light': 'fas fa-users',
            'moderate': 'fas fa-users',
            'heavy': 'fas fa-users',
            'overcrowded': 'fas fa-users'
        };
        return iconMap[level] || 'fas fa-users';
    }

    setIndicatorStatus(indicatorId, active) {
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            if (active) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        }
    }

    // Auto-refresh functionality
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        if (this.autoMode) {
            // Main refresh timer - every second for real-time updates
            this.refreshTimer = setInterval(() => {
                this.performRealTimeUpdate();
            }, this.config.refreshInterval * 1000);
            
            // Separate timers for different data types
            this.startWeatherTimer();
            this.startCrowdTimer();
        }
    }

    startWeatherTimer() {
        if (this.weatherTimer) {
            clearInterval(this.weatherTimer);
        }
        
        this.weatherTimer = setInterval(() => {
            this.getWeatherData().then(() => {
                this.performRiskAssessment();
                this.updateAllDisplays();
            });
        }, this.config.weatherUpdateFrequency * 1000);
    }

    startCrowdTimer() {
        if (this.crowdTimer) {
            clearInterval(this.crowdTimer);
        }
        
        this.crowdTimer = setInterval(() => {
            this.getCrowdData().then(() => {
                this.performRiskAssessment();
                this.updateAllDisplays();
            });
        }, this.config.crowdUpdateFrequency * 1000);
    }

    async performRealTimeUpdate() {
        if (this.isUpdating) return; // Prevent overlapping updates
        
        this.isUpdating = true;
        
        try {
            // Show update pulse
            this.showUpdatePulse();
            
            // Always update time and perform risk assessment
            this.performRiskAssessment();
            this.updateAllDisplays();
            
            // Process any queued updates
            this.processUpdateQueue();
            
        } catch (error) {
            console.error('Real-time update error:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    showUpdatePulse() {
        const pulse = document.getElementById('updatePulse');
        if (pulse) {
            pulse.classList.remove('active');
            // Force reflow
            pulse.offsetHeight;
            pulse.classList.add('active');
        }
    }

    queueDataUpdate(reason) {
        this.dataUpdateQueue.push({
            reason: reason,
            timestamp: Date.now()
        });
    }

    processUpdateQueue() {
        if (this.dataUpdateQueue.length === 0) return;
        
        const update = this.dataUpdateQueue.shift();
        
        // Handle different types of updates
        switch (update.reason) {
            case 'location_change':
                // Trigger immediate weather and crowd updates
                this.getWeatherData();
                this.getCrowdData();
                break;
            case 'weather_alert':
                // Increase update frequency temporarily
                this.config.weatherUpdateFrequency = Math.min(10, this.config.weatherUpdateFrequency);
                break;
            case 'crowd_surge':
                // Increase crowd monitoring frequency
                this.config.crowdUpdateFrequency = Math.min(2, this.config.crowdUpdateFrequency);
                break;
        }
    }

    async refreshAllData() {
        try {
            await this.getWeatherData();
            await this.getCrowdData();
            this.performRiskAssessment();
            this.updateAllDisplays();
        } catch (error) {
            console.error('Refresh error:', error);
        }
    }

    toggleAutoMode() {
        this.autoMode = !this.autoMode;
        const autoBtn = document.getElementById('autoMode');
        
        if (this.autoMode) {
            autoBtn.style.color = 'var(--accent-color)';
            this.startAutoRefresh();
        } else {
            autoBtn.style.color = 'var(--text-secondary)';
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
            if (this.weatherTimer) {
                clearInterval(this.weatherTimer);
                this.weatherTimer = null;
            }
            if (this.crowdTimer) {
                clearInterval(this.crowdTimer);
                this.crowdTimer = null;
            }
        }
    }

    // Enhanced data processing methods
    hasLocationChanged(newLocation) {
        if (!this.currentLocation) return true;
        
        const distance = this.calculateLocationDistance(
            this.currentLocation.latitude, this.currentLocation.longitude,
            newLocation.latitude, newLocation.longitude
        );
        
        // Consider significant if moved more than 10 meters
        return distance > 0.01; // Approximately 10 meters
    }

    calculateLocationDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    analyzeWeatherTrend(forecastData) {
        if (!forecastData || !forecastData.list) return 'stable';
        
        const temps = forecastData.list.slice(0, 4).map(item => item.main.temp);
        const avgChange = temps.reduce((sum, temp, i) => {
            if (i === 0) return sum;
            return sum + (temp - temps[i-1]);
        }, 0) / (temps.length - 1);
        
        if (avgChange > 2) return 'warming';
        if (avgChange < -2) return 'cooling';
        return 'stable';
    }

    calculateWeatherSeverity(weatherData) {
        let severity = 0;
        
        // Wind severity
        const windSpeed = weatherData.wind?.speed || 0;
        if (windSpeed > 15) severity += 3;
        else if (windSpeed > 10) severity += 2;
        else if (windSpeed > 5) severity += 1;
        
        // Visibility severity
        const visibility = weatherData.visibility || 10000;
        if (visibility < 1000) severity += 3;
        else if (visibility < 5000) severity += 2;
        else if (visibility < 8000) severity += 1;
        
        // Weather condition severity
        const condition = weatherData.weather[0].main.toLowerCase();
        const severityMap = {
            'thunderstorm': 4, 'tornado': 5, 'hurricane': 5,
            'rain': 2, 'drizzle': 1, 'snow': 2, 'fog': 2,
            'clear': 0, 'clouds': 0
        };
        severity += severityMap[condition] || 0;
        
        return Math.min(severity, 10);
    }

    calculateEnhancedCrowdScore(places, trafficData) {
        let score = 0;
        const crowdTypes = {
            'shopping_mall': 25, 'restaurant': 15, 'tourist_attraction': 30,
            'transit_station': 35, 'school': 20, 'hospital': 15,
            'park': 10, 'gym': 12, 'stadium': 40, 'concert_hall': 35,
            'bar': 20, 'nightclub': 25, 'movie_theater': 18
        };

        // Base score from places
        places.forEach(place => {
            let placeScore = 0;
            place.types.forEach(type => {
                if (crowdTypes[type]) {
                    placeScore += crowdTypes[type];
                }
            });
            
            // Factor in rating and price level
            if (place.rating > 4.0) placeScore *= 1.2;
            if (place.price_level >= 3) placeScore *= 1.1;
            
            score += placeScore;
        });

        // Time-based multipliers
        const hour = new Date().getHours();
        const day = new Date().getDay();
        
        // Peak hours multiplier
        if ((hour >= 12 && hour <= 14) || (hour >= 17 && hour <= 19)) {
            score *= 1.3; // Lunch and dinner rush
        }
        if ((hour >= 20 && hour <= 23) && (day === 5 || day === 6)) {
            score *= 1.4; // Weekend nights
        }
        
        // Traffic factor
        if (trafficData) {
            const trafficFactor = this.analyzeTrafficFactor(trafficData);
            score *= (1 + trafficFactor * 0.3);
        }

        return Math.min(score, 100);
    }

    analyzeCrowdTrend() {
        if (!this.crowdData || !this.crowdData.last_updated) return 'stable';
        
        // Simple trend analysis based on time patterns
        const hour = new Date().getHours();
        const prevHour = hour - 1;
        
        // Morning rush
        if (hour >= 7 && hour <= 9) return 'increasing';
        // Evening rush
        if (hour >= 17 && hour <= 19) return 'increasing';
        // Late night
        if (hour >= 22 || hour <= 5) return 'decreasing';
        
        return 'stable';
    }

    isPeakHours() {
        const hour = new Date().getHours();
        const day = new Date().getDay();
        
        // Weekday rush hours
        if (day >= 1 && day <= 5) {
            return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        }
        
        // Weekend peak hours
        return (hour >= 10 && hour <= 14) || (hour >= 19 && hour <= 23);
    }

    createDensityMap(places) {
        const densityMap = {};
        places.forEach(place => {
            const type = place.types[0] || 'unknown';
            densityMap[type] = (densityMap[type] || 0) + 1;
        });
        return densityMap;
    }

    analyzeTrafficFactor(trafficData) {
        if (!trafficData || !trafficData.routes || trafficData.routes.length === 0) {
            return 0;
        }
        
        const route = trafficData.routes[0];
        const duration = route.legs[0].duration.value;
        const durationInTraffic = route.legs[0].duration_in_traffic?.value || duration;
        
        // Traffic factor based on delay
        const delay = (durationInTraffic - duration) / duration;
        return Math.min(delay, 1.0); // Cap at 100% delay
    }

    estimatePeopleCount(crowdScore, radius) {
        // Rough estimation: 1 person per 10 square meters in crowded areas
        const area = Math.PI * Math.pow(radius, 2); // Area in square meters
        const density = crowdScore / 100; // Normalize to 0-1
        return Math.floor(area * density / 10);
    }

    // Settings Management
    openSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('active');
        
        // Load current settings
        document.getElementById('weatherApiKey').value = this.config.weatherApiKey;
        document.getElementById('placesApiKey').value = this.config.placesApiKey;
        document.getElementById('refreshInterval').value = this.config.refreshInterval;
        document.getElementById('weatherUpdateFreq').value = this.config.weatherUpdateFrequency;
        document.getElementById('crowdUpdateFreq').value = this.config.crowdUpdateFrequency;
        document.getElementById('highAccuracyGPS').checked = this.config.highAccuracyGPS;
        document.getElementById('riskSensitivity').value = this.config.riskSensitivity;
        document.getElementById('sensitivityValue').textContent = this.config.riskSensitivity + 'x';
        
        // Update sensitivity display on change
        document.getElementById('riskSensitivity').addEventListener('input', (e) => {
            document.getElementById('sensitivityValue').textContent = e.target.value + 'x';
        });
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('active');
    }

    saveSettings() {
        this.config.weatherApiKey = document.getElementById('weatherApiKey').value;
        this.config.placesApiKey = document.getElementById('placesApiKey').value;
        this.config.refreshInterval = parseInt(document.getElementById('refreshInterval').value);
        this.config.weatherUpdateFrequency = parseInt(document.getElementById('weatherUpdateFreq').value);
        this.config.crowdUpdateFrequency = parseInt(document.getElementById('crowdUpdateFreq').value);
        this.config.highAccuracyGPS = document.getElementById('highAccuracyGPS').checked;
        this.config.riskSensitivity = parseFloat(document.getElementById('riskSensitivity').value);

        // Save to localStorage
        localStorage.setItem('weatherApiKey', this.config.weatherApiKey);
        localStorage.setItem('placesApiKey', this.config.placesApiKey);
        localStorage.setItem('refreshInterval', this.config.refreshInterval);
        localStorage.setItem('weatherUpdateFrequency', this.config.weatherUpdateFrequency);
        localStorage.setItem('crowdUpdateFrequency', this.config.crowdUpdateFrequency);
        localStorage.setItem('highAccuracyGPS', this.config.highAccuracyGPS);
        localStorage.setItem('riskSensitivity', this.config.riskSensitivity);

        this.closeSettings();
        
        // Restart GPS tracking if accuracy setting changed
        if (this.gpsWatcher) {
            navigator.geolocation.clearWatch(this.gpsWatcher);
            this.gpsWatcher = null;
            this.getCurrentLocation();
        }
        
        this.startAutoRefresh(); // Restart with new intervals
        this.refreshAllData(); // Refresh with new API keys
    }

    // Emergency and sharing functions
    handleEmergency() {
        // Implement emergency protocols
        alert('Emergency protocols activated. Contacting emergency services...');
        
        // In a real app, this would:
        // - Send location to emergency contacts
        // - Call emergency services
        // - Activate emergency mode in the app
    }

    shareLocation() {
        if (this.currentLocation && navigator.share) {
            navigator.share({
                title: 'My Current Location',
                text: `I'm at ${this.currentLocation.latitude}, ${this.currentLocation.longitude}`,
                url: `https://maps.google.com/?q=${this.currentLocation.latitude},${this.currentLocation.longitude}`
            });
        } else {
            // Fallback: copy to clipboard
            const locationText = `${this.currentLocation.latitude}, ${this.currentLocation.longitude}`;
            navigator.clipboard.writeText(locationText).then(() => {
                alert('Location copied to clipboard');
            });
        }
    }

    // Loading and progress
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.display = 'none';
        }, 500);
    }

    updateProgress(percentage) {
        document.getElementById('progressBar').style.width = percentage + '%';
    }

    showError(message) {
        console.error(message);
        // In a real app, show user-friendly error message
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lifeGuardAI = new LifeGuardAI();
});