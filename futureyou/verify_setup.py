#!/usr/bin/env python
"""
FutureYou Setup Verification Script
This script checks if all required dependencies, models, and configuration are in place.
Run this before starting the backend to catch any issues early.
"""

import os
import sys
import json
from pathlib import Path

def check_python_version():
    """Verify Python version is 3.9+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print(f"❌ Python 3.9+ required, but found Python {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor} (OK)")
    return True

def check_requirements():
    """Check if all required packages are installed"""
    required = [
        'fastapi', 'uvicorn', 'pydantic', 
        'scikit-learn', 'numpy', 'pandas', 'scipy',
        'shap', 'joblib', 'requests', 'python-dotenv',
        'plotly'
    ]
    
    import_names = {
        'scikit-learn': 'sklearn',
        'python-dotenv': 'dotenv'
    }
    
    missing = []
    for package in required:
        import_name = import_names.get(package, package.replace('-', '_'))
        try:
            __import__(import_name)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package}")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print(f"   Run: pip install {' '.join(missing)}")
        return False
    return True

def check_models():
    """Check if all trained models exist"""
    model_dir = Path("models")
    required_models = [
        "exam_model.pkl",
        "dropout_model.pkl", 
        "stress_model.pkl",
        "wb_model.pkl",
        "features_main.pkl",
        "features_stress.pkl",
        "features_wb.pkl",
        "scaler_main.pkl",
        "scaler_stress.pkl",
        "scaler_wb.pkl"
    ]
    
    if not model_dir.exists():
        print("❌ models/ directory not found")
        print("   Run: python train_models.py")
        return False
    
    missing = []
    for model in required_models:
        model_path = model_dir / model
        if model_path.exists():
            size_mb = model_path.stat().st_size / (1024 * 1024)
            print(f"✅ {model} ({size_mb:.1f} MB)")
        else:
            print(f"❌ {model}")
            missing.append(model)
    
    if missing:
        print(f"\n⚠️  Missing models: {', '.join(missing)}")
        print(f"   Run: python train_models.py")
        return False
    return True

def check_env():
    """Check if .env file is configured"""
    env_path = Path(".env")
    
    if not env_path.exists():
        print("❌ .env file not found")
        print("   Copy .env.example to .env and fill in your values:")
        print("   cp .env.example .env")
        return False
    
    # Load and check for required keys
    from dotenv import load_dotenv
    load_dotenv()
    
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key or groq_key == "your_groq_api_key_here":
        print("❌ GROQ_API_KEY not set in .env")
        print("   Get free key at: https://console.groq.com")
        return False
    
    print(f"✅ GROQ_API_KEY found (first 8 chars: {groq_key[:8]}...)")
    
    vite_api = os.getenv("VITE_API_URL", "http://localhost:8000")
    print(f"✅ VITE_API_URL: {vite_api}")
    
    return True

def check_data():
    """Check if training data exists"""
    data_dir = Path("data")
    required_files = [
        "enhanced_student_habits_performance_dataset.csv",
        "StressLevelDataset.csv",
        "Wellbeing_and_lifestyle_data_Kaggle.csv"
    ]
    
    if not data_dir.exists():
        print("⚠️  data/ directory not found (OK if models already trained)")
        return True
    
    for file in required_files:
        file_path = data_dir / file
        if file_path.exists():
            size_mb = file_path.stat().st_size / (1024 * 1024)
            print(f"✅ {file} ({size_mb:.1f} MB)")
        else:
            print(f"⚠️  {file} not found")
    
    return True

def test_imports():
    """Quick test of critical imports"""
    try:
        from predictor import load_models, predict_all, generate_trajectory, build_future_context
        print("✅ predictor module imports OK")
        
        # Try loading models
        models = load_models()
        if models:
            print("✅ Models loaded successfully")
            return True
        else:
            print("❌ Failed to load models (check models/ directory)")
            return False
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def main():
    print("=" * 60)
    print("FutureYou Setup Verification")
    print("=" * 60)
    
    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_requirements),
        ("Data Files", check_data),
        ("Models", check_models),
        ("Environment Config", check_env),
        ("Model Imports", test_imports),
    ]
    
    results = []
    for name, check in checks:
        print(f"\n{name}:")
        print("-" * 40)
        try:
            result = check()
            results.append((name, result))
        except Exception as e:
            print(f"❌ Error: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    all_pass = True
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
        if not result:
            all_pass = False
    
    if all_pass:
        print("\n🎉 All checks passed! Ready to start backend:")
        print("   uvicorn api:app --reload --port 8000")
        return 0
    else:
        print("\n⚠️  Some checks failed. See above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
