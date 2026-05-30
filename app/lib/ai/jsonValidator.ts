// JSON Validator - Ensures AI responses are valid JSON
// Attempts to repair common JSON issues

export interface ValidationResult {
  valid: boolean;
  data: any;
  error?: string;
}

export function validateJSON(response: string, expectedKeys?: string[]): ValidationResult {
  try {
    // Try to parse as-is
    const parsed = JSON.parse(response);
    
    // Check for expected keys if provided
    if (expectedKeys) {
      const missingKeys = expectedKeys.filter(key => !(key in parsed));
      if (missingKeys.length > 0) {
        return {
          valid: false,
          data: parsed,
          error: `Missing keys: ${missingKeys.join(', ')}`,
        };
      }
    }
    
    return { valid: true, data: parsed };
  } catch (e) {
    // Try to repair common issues
    let cleaned = response;
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\n?/g, '');
    cleaned = cleaned.replace(/```\n?/g, '');
    
    // Try to extract JSON object from text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { valid: true, data: parsed };
      } catch (innerError) {
        // Still invalid
      }
    }
    
    return {
      valid: false,
      data: null,
      error: `Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }
}

// Safe JSON extraction from AI response
export function extractJSON(response: string): any | null {
  const result = validateJSON(response);
  return result.valid ? result.data : null;
}
