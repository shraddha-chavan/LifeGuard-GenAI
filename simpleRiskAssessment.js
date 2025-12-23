/**
 * Simple Risk Assessment Function
 * Takes location, time, weather, and crowd density parameters
 * Returns LOW, MEDIUM, or HIGH risk in JSON format with preventive steps
 */

/**
 * Generates preventive steps based on risk level and specific factors
 * @param {string} riskLevel - LOW, MEDIUM, or HIGH
 * @param {Array} riskFactors - Array of identified risk factors
 * @returns {Array} Array of preventive action steps
 */
function generatePreventiveSteps(riskLevel, riskFactors) {
    const steps = [];

    // Base steps for all risk levels
    steps.push("Stay aware of your surroundings");
    steps.push("Keep emergency contacts accessible");

    // Risk level specific steps
    if (riskLevel === 'HIGH') {
        steps.push("Consider immediate relocation to safer area");
        steps.push("Contact emergency services if in immediate danger");
        steps.push("Stay in constant communication with others");
        steps.push("Have evacuation plan ready");
        steps.push("Avoid unnecessary movement or activities");
    } else if (riskLevel === 'MEDIUM') {
        steps.push("Exercise increased caution");
        steps.push("Stay in groups when possible");
        steps.push("Monitor conditions closely for changes");
        steps.push("Keep communication devices charged");
        steps.push("Identify nearest safe locations");
    } else if (riskLevel === 'LOW') {
        steps.push("Continue normal activities with basic precautions");
        steps.push("Stay informed of changing conditions");
    }

    // Factor-specific preventive steps
    if (riskFactors.includes('severe weather') || riskFactors.includes('adverse weather')) {
        steps.push("Seek shelter from weather conditions");
        steps.push("Avoid outdoor activities if possible");
        steps.push("Monitor weather alerts and updates");
    }

    if (riskFactors.includes('nighttime conditions') || riskFactors.includes('low light conditions')) {
        steps.push("Use adequate lighting and visibility aids");
        steps.push("Stay in well-lit areas");
        steps.push("Travel with others when possible");
    }

    if (riskFactors.includes('overcrowding hazard') || riskFactors.includes('high crowd density')) {
        steps.push("Identify multiple exit routes");
        steps.push("Avoid pushing through dense crowds");
        steps.push("Stay calm and move slowly");
        steps.push("Keep personal belongings secure");
    }

    if (riskFactors.includes('isolation risk') || riskFactors.includes('remote location')) {
        steps.push("Inform others of your location and plans");
        steps.push("Carry extra supplies and communication devices");
        steps.push("Consider traveling with companions");
    }

    if (riskFactors.includes('water proximity')) {
        steps.push("Maintain safe distance from water edges");
        steps.push("Be aware of water conditions and currents");
        steps.push("Ensure proper safety equipment if near water");
    }

    if (riskFactors.includes('hazardous area')) {
        steps.push("Follow all posted safety signs and barriers");
        steps.push("Use appropriate protective equipment");
        steps.push("Minimize time spent in hazardous areas");
    }

    // Remove duplicates and return unique steps
    return [...new Set(steps)];
}

function assessRisk(location, time, weather, crowdDensity) {
    let riskScore = 0;
    const riskFactors = [];

    // Weather risk assessment
    const weatherLower = weather.toLowerCase();
    if (weatherLower.includes('storm') || weatherLower.includes('tornado') || weatherLower.includes('hurricane')) {
        riskScore += 3;
        riskFactors.push('severe weather');
    } else if (weatherLower.includes('rain') || weatherLower.includes('snow') || weatherLower.includes('fog')) {
        riskScore += 2;
        riskFactors.push('adverse weather');
    } else if (weatherLower.includes('cloudy') || weatherLower.includes('overcast')) {
        riskScore += 1;
        riskFactors.push('reduced visibility');
    }

    // Time-based risk assessment
    const timeLower = time.toLowerCase();
    if (timeLower.includes('night') || timeLower.includes('midnight') || timeLower.includes('late')) {
        riskScore += 2;
        riskFactors.push('nighttime conditions');
    } else if (timeLower.includes('evening') || timeLower.includes('dawn') || timeLower.includes('dusk')) {
        riskScore += 1;
        riskFactors.push('low light conditions');
    }

    // Crowd density risk assessment
    const crowdLower = crowdDensity.toLowerCase();
    if (crowdLower.includes('overcrowded') || crowdLower.includes('packed') || crowdLower.includes('dangerous')) {
        riskScore += 3;
        riskFactors.push('overcrowding hazard');
    } else if (crowdLower.includes('heavy') || crowdLower.includes('dense')) {
        riskScore += 2;
        riskFactors.push('high crowd density');
    } else if (crowdLower.includes('isolated') || crowdLower.includes('alone') || crowdLower.includes('remote')) {
        riskScore += 1;
        riskFactors.push('isolation risk');
    }

    // Location-based risk assessment
    const locationLower = location.toLowerCase();
    if (locationLower.includes('construction') || locationLower.includes('industrial') || locationLower.includes('hazardous')) {
        riskScore += 2;
        riskFactors.push('hazardous area');
    } else if (locationLower.includes('remote') || locationLower.includes('wilderness') || locationLower.includes('isolated')) {
        riskScore += 1;
        riskFactors.push('remote location');
    } else if (locationLower.includes('water') || locationLower.includes('beach') || locationLower.includes('river')) {
        riskScore += 1;
        riskFactors.push('water proximity');
    }

    // Determine risk level based on total score
    let riskLevel;
    if (riskScore >= 5) {
        riskLevel = 'HIGH';
    } else if (riskScore >= 3) {
        riskLevel = 'MEDIUM';
    } else {
        riskLevel = 'LOW';
    }

    // Generate preventive steps based on risk level and factors
    const preventiveSteps = generatePreventiveSteps(riskLevel, riskFactors);

    // Return JSON result
    return {
        risk_level: riskLevel,
        risk_score: riskScore,
        factors: riskFactors,
        preventive_steps: preventiveSteps,
        assessment: {
            location: location,
            time: time,
            weather: weather,
            crowd_density: crowdDensity
        },
        timestamp: new Date().toISOString()
    };
}

// Example usage:
// const result = assessRisk("downtown area", "night time", "heavy rain", "overcrowded");
// console.log(JSON.stringify(result, null, 2));

// Standalone function to generate preventive steps
// const steps = generatePreventiveSteps("HIGH", ["severe weather", "nighttime conditions"]);
// console.log(steps);

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { assessRisk, generatePreventiveSteps };
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.assessRisk = assessRisk;
    window.generatePreventiveSteps = generatePreventiveSteps;
}