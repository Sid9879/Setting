const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');

exports.updateEnvVariable = (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key || typeof value === 'undefined') {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide both 'key' and 'value' in the request body." 
            });
        }

        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Split keeping carriage returns if present
        const envLines = envContent.split(/\r?\n/);
        let keyExists = false;

        for (let i = 0; i < envLines.length; i++) {
            // Check if the line matches the key (handling possible whitespace)
            const line = envLines[i].trim();
            if (line.startsWith(`${key}=`)) {
                envLines[i] = `${key}=${value}`;
                keyExists = true;
                break;
            }
        }

        if (!keyExists) {
            // Avoid adding an empty line if the file was completely empty or had trailing newline
            envLines.push(`${key}=${value}`);
        }

        const newEnvContent = envLines.join('\n').trim() + '\n';
        fs.writeFileSync(envPath, newEnvContent);

        // Update current running process memory
        process.env[key] = value;

        res.status(200).json({ 
            success: true, 
            message: `Successfully ${keyExists ? 'updated' : 'added'} ${key} in .env file.` 
        });
    } catch (error) {
        console.error("Error updating .env file:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error while updating .env file." 
        });
    }
};
