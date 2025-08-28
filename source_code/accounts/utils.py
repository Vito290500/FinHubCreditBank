"""
File utils per la generazione del pin
"""

import secrets

def generate_pin(n: int = 6) -> str:
    return ''.join(secrets.choice('0123456789') for _ in range(n))

def mask_iban(iban: str) -> str:
    if not iban:
        return ""
    return iban[:4] + " •••• •••• •••• " + iban[-4:]