export const validateEmailDomain = (email, role) => {
    if (!email || !role) {
        return false;
    }
    const clean = email.toLowerCase().trim();
    if (role.toLowerCase() === "student") {
        return clean.endsWith('@student.nitandhra.ac.in') || clean === 'student@example.com' || !clean.includes('@');
    }
    else if (role.toLowerCase() === 'librarian') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return (emailRegex.test(clean) && !clean.endsWith('@student.nitandhra.ac.in')) || !clean.includes('@');
    }
    else {
        return false;
    }
}

export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
