export interface GenshinUIDValidationResult {
  valid: boolean;
  message?: string;
  server?: string;
}

export const validateGenshinUID = (uid: string): GenshinUIDValidationResult => {
  if (!uid || uid.trim() === "") {
    return {
      valid: false,
      message: "UID cannot be empty",
    };
  }

  const cleanUID = uid.trim();
  
  if (!/^\d+$/.test(cleanUID)) {
    return {
      valid: false,
      message: "UID must contain only numbers",
    };
  }

  const firstDigit = parseInt(cleanUID[0]);
  
  const serverMap: Record<number, string> = {
    6: "America",
    7: "Europe", 
    8: "Asia",
    9: "TW/HK/MO",
  };

  if (firstDigit >= 6 && firstDigit <= 9) {
    return {
      valid: true,
      server: serverMap[firstDigit],
      message: `Valid UID for ${serverMap[firstDigit]} server`,
    };
  }

  return {
    valid: true,
    message: "Valid UID",
  };
};
