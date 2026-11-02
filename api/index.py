"""
VisionAries - Vercel Serverless Function Entry Point
Exposes the Flask WSGI app for Vercel Python runtime
"""
import os
import sys

# Add root directory to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from app import app

# Vercel looks for 'app' as the WSGI callable
