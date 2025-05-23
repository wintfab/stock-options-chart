# Copyright (c) 2025 fwinter. All rights reserved.

"""
Script to sign in to https://site.financialmodelingprep.com/ and extract the API key text.
Requires: selenium, webdriver-manager

Usage:
    python extract_key.py <email> <password>
"""
import sys
import time
import traceback
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.edge.service import Service as EdgeService
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.webdriver.edge.options import Options as EdgeOptions


def extract_api_key(email, password):
    print("[INFO] Starting Edge browser in headless mode...")
    options = EdgeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Edge(service=EdgeService(EdgeChromiumDriverManager().install()), options=options)
    try:
        print("[INFO] Navigating to login page...")
        driver.get("https://site.financialmodelingprep.com/login")
        time.sleep(2)
        print("[INFO] Filling in email...")
        email_input = driver.find_element(By.NAME, "email")
        email_input.clear()
        email_input.send_keys(email)
        print("[INFO] Filling in password...")
        password_input = driver.find_element(By.NAME, "password")
        password_input.clear()
        password_input.send_keys(password)
        password_input.send_keys(Keys.RETURN)
        print("[INFO] Logging in...")
        time.sleep(4)
        print("[INFO] Navigating to dashboard...")
        driver.get("https://site.financialmodelingprep.com/developer/docs/dashboard/")
        time.sleep(3)
        print("[INFO] Extracting API key...")
        api_key_elem = driver.find_element(By.XPATH, '//*[@id="__next"]/div/div[2]/div[2]/div/div[1]/div[2]/div[2]/div[1]/p')
        api_key = api_key_elem.text
        print(f"[SUCCESS] API Key extracted: {api_key}")
    except Exception as e:
        if hasattr(e, 'msg'):
            print(f"[ERROR] Failed to extract API key: {e.msg}")
        else:
            print(f"[ERROR] Failed to extract API key: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python extract_key.py <email> <password>")
        sys.exit(1)
    print("[INFO] Starting API key extraction script...")
    extract_api_key(sys.argv[1], sys.argv[2])
