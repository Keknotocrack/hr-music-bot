#!/usr/bin/env python3

import inspect
import highrise

print("=== Highrise SDK Analysis ===")

# Check main modules
print("\nAvailable in highrise package:")
for item in dir(highrise):
    if not item.startswith('_'):
        obj = getattr(highrise, item)
        if inspect.ismodule(obj):
            print(f"  Module: {item}")
        elif inspect.isclass(obj):
            print(f"  Class: {item}")
        elif inspect.isfunction(obj):
            print(f"  Function: {item}")

# Check BaseBot specifically
from highrise import BaseBot
print(f"\nBaseBot methods:")
for method in dir(BaseBot):
    if not method.startswith('_'):
        print(f"  {method}")

# Check if there's a main module
try:
    from highrise import __main__
    print(f"\nHighrise __main__ methods:")
    for item in dir(__main__):
        if not item.startswith('_'):
            print(f"  {item}")
except ImportError:
    print("\nNo __main__ module found")

# Look for connection methods
print(f"\nLooking for connection/run methods...")
import highrise
for item in dir(highrise):
    if 'run' in item.lower() or 'connect' in item.lower() or 'start' in item.lower():
        print(f"  Found: {item}")