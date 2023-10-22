#! /bin/bash
aws dynamodb execute-statement --region eu-central-1 --statement "INSERT INTO products VALUE {'id':'id-1', 'title': 'Fuji apple', 'description': 'Taste fuji apple from Japan', 'price': 100}"
aws dynamodb execute-statement --region eu-central-1 --statement "INSERT INTO products VALUE {'id':'id-2', 'title': 'Watermelon', 'description': 'Yep.', 'price':10}"
aws dynamodb execute-statement --region eu-central-1 --statement "INSERT INTO products VALUE {'id':'id-3', 'title': 'Banana', 'description': 'Intergalactic unit of measurement', 'price':500}"
aws dynamodb execute-statement --region eu-central-1 --statement "INSERT INTO products VALUE {'id':'id-4', 'title': 'Beer', 'description': 'Its a fruit too.', 'price': 1000}"

aws dynamodb execute-statement --region eu-central-1 --statement "INSERT INTO stocks VALUE {'product_id':'id-1', 'count':0}"
aws dynamodb execute-statement --region eu-central-1 --statement "INSERT INTO stocks VALUE {'product_id':'id-2', 'count': 5}"
aws dynamodb execute-statement --region eu-central-1 --statement "INSERT INTO stocks VALUE {'product_id':'id-3', 'count':9999}"
aws dynamodb execute-statement --region eu-central-1 --statement "INSERT INTO stocks VALUE {'product_id':'id-4', 'count': 10}"