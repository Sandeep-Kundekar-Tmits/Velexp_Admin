import { amountToWords } from "amount-to-words"

// Shared "Amount in words" formatter for all invoice PDF views.
// amount-to-words spells a single-digit paise value (e.g. 4) as just "Four",
// but invoices here want it read the way it's written -- two digits, so a
// value under 10 needs its leading zero spoken too ("Zero Four"). A value
// of 10+ (e.g. 12) already reads naturally ("Twelve") and is left as-is.
export const formatAmountInWords = (amount) => {
    const value = Number(amount) || 0
    const { numberInWords, decimalInWords } = amountToWords(value, 2)
    const paise = Math.round((value - Math.floor(value)) * 100)

    let words = numberInWords ? `${numberInWords} Rupees` : "Zero Rupees"
    if (paise > 0) {
        const paiseWords = paise < 10 ? `Zero ${decimalInWords}` : decimalInWords
        words += ` And ${paiseWords} Paise`
    }
    return `${words} Only`.toUpperCase()
}
