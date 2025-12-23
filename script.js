class LifeGuardMonitor {
    constructor() {
        this.initializeEventListeners();
        this.currentTime = new Date();
    }

    initializeEventListeners() {
        document.getElementById('environmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeEnvironment();
        });

        document.getElementById('getLocation').addEventListener('click', () => {
            this.getCurrentLocation();
        });
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    document.getElementById('location').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                },
                (error) => {
                    alert('Unable to get location: ' + error.message);
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    extractContext() {
        const location = document.getElementById('location').value;
        const weather = document.getElementById('weather').value;
        const crowdLevel = document.getElementById('crowdLevel').value;
        
        const now = new Date();
        const timeContext = this.getTimeContext(now);
        
        return {
            location_context: location || "Location not specified",
            time_context: timeContext,
            weather_context: weather || "Weather conditions unknown",
            movement_context: "Stationary analysis", // Could be enhanced with motion sensors
            environment_summary: this.generateEnvironmentSummary(location, weather, crowdLevel, timeContext)
        };
    }

    getTimeContext(date) {
        const hour = date.getHours();
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        let timeOfDay;
        if (hour >= 5 && hour < 12) timeOfDay = "Morning";
        else if (hour >= 12 && hour < 17) timeOfDay = "Afternoon";
        else if (hour >= 17 && hour < 21) timeOfDay = "Evening";
        else timeOfDay = "Night";
        
        return `${dayOfWeek} ${timeOfDay} (${hour}:${date.getMinutes().toString().padStart(2, '0')})`;
    }

    generateEnvironmentSummary(location, weather, crowdLevel, timeContext) {
        const conditions = [];
        
        if (weather) conditions.push(`${weather} weather`);
        if (crowdLevel) conditions.push(`${crowdLevel} crowd density`);
        conditions.push(timeContext.toLowerCase());
        
        return `Current situation: ${conditions.join(', ')} at ${location || 'unspecified location'}`;
    }

    assessRisk(context) {
        let riskScore = 0;
        const riskFactors = [];
        
        // Weather risk assessment
        const weather = context.weather_context.toLowerCase();
        if (weather.includes('stormy') || weather.includes('severe')) {
            riskScore += 3;
            riskFactors.push('Severe weather conditions');
        } else if (weather.includes('rainy') || weather.includes('foggy')) {
            riskScore += 2;
            riskFactors.push('Reduced visibility/wet conditions');
        }
        
        // Time-based risk
        const timeContext = context.time_context.toLowerCase();
        if (timeContext.includes('night')) {
            riskScore += 2;
            riskFactors.push('Low light conditions');
        }
        
        // Crowd density risk
        const environment = context.environment_summary.toLowerCase();
        if (environment.includes('overcrowded')) {
            riskScore += 3;
            riskFactors.push('Overcrowding hazard');
        } else if (environment.includes('isolated')) {
            riskScore += 1;
            riskFactors.push('Isolated area - limited help available');
        }
        
        // Determine risk level
        let riskLevel, riskClass, recommendations;
        if (riskScore >= 5) {
            riskLevel = 'HIGH RISK';
            riskClass = 'risk-high';
            recommendations = [
                'Consider relocating to a safer area immediately',
                'Stay in contact with others',
                'Have emergency contacts ready',
                'Monitor conditions closely'
            ];
        } else if (riskScore >= 3) {
            riskLevel = 'MEDIUM RISK';
            riskClass = 'risk-medium';
            recommendations = [
                'Stay alert and aware of surroundings',
                'Keep communication devices charged',
                'Plan exit routes',
                'Monitor weather updates'
            ];
        } else {
            riskLevel = 'LOW RISK';
            riskClass = 'risk-low';
            recommendations = [
                'Continue normal activities with basic precautions',
                'Stay aware of changing conditions',
                'Keep emergency contacts accessible'
            ];
        }
        
        return {
            level: riskLevel,
            class: riskClass,
            score: riskScore,
            factors: riskFactors,
            recommendations: recommendations
        };
    }

    displayResults(context, riskAssessment) {
        const resultsSection = document.getElementById('results');
        const contextOutput = document.getElementById('contextOutput');
        const riskOutput = document.getElementById('riskAssessment');
        
        // Display context
        contextOutput.innerHTML = `
            <div class="context-card">
                <h3>Environmental Context</h3>
                <p><strong>Location:</strong> ${context.location_context}</p>
                <p><strong>Time:</strong> ${context.time_context}</p>
                <p><strong>Weather:</strong> ${context.weather_context}</p>
                <p><strong>Environment:</strong> ${context.environment_summary}</p>
            </div>
        `;
        
        // Display risk assessment
        riskOutput.innerHTML = `
            <div class="risk-card ${riskAssessment.class}">
                <div class="risk-level">${riskAssessment.level}</div>
                <p><strong>Risk Score:</strong> ${riskAssessment.score}/10</p>
                ${riskAssessment.factors.length > 0 ? 
                    `<p><strong>Risk Factors:</strong> ${riskAssessment.factors.join(', ')}</p>` : 
                    '<p>No significant risk factors identified.</p>'
                }
                <div class="recommendations">
                    <h4>Recommended Actions:</h4>
                    <ul>
                        ${riskAssessment.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    analyzeEnvironment() {
        // Extract context from form data
        const context = this.extractContext();
        
        // Assess risk based on context
        const riskAssessment = this.assessRisk(context);
        
        // Display results
        this.displayResults(context, riskAssessment);
        
        // Log for debugging (remove in production)
        console.log('Context:', context);
        console.log('Risk Assessment:', riskAssessment);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LifeGuardMonitor();
});