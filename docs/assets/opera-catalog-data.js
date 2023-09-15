var schema = {
    "id": "3",
    "description": "",
    "createdAt": "2023-09-01T10:11:59.388989Z",
    "schema": {
        "type": "object",
        "encrypted": false,
        "properties": {
            "varInt": {
                "type": "integer",
                "encrypted": false,
                "title": "Var Int"
            },
            "varNum": {
                "type": "number",
                "encrypted": false,
                "title": "Var Num"
            },
            "varStr": {
                "type": "string",
                "encrypted": false,
                "title": "Var String"
            },
            "varNumAdv": {
                "type": "number",
                "encrypted": false,
                "title": "Var Num Adv",
                "maximum": 100.0,
                "minimum": 1.0,
                "default": 5
            },
            "varObject": {
                "type": "object",
                "encrypted": false,
                "title": "Var Object",
                "properties": {
                    "varNum": {
                        "type": "number",
                        "encrypted": false,
                        "title": "Var Num"
                    },
                    "varStr": {
                        "type": "string",
                        "encrypted": false,
                        "title": "Var Str"
                    }
                }
            },
            "varBoolean": {
                "type": "boolean",
                "encrypted": false,
                "title": "Var Boolean",
                "default": true
            },
            "varStrAdv1": {
                "type": "string",
                "encrypted": false,
                "title": "Var String Adv1",
                "enum": [
                    "hahaha",
                    "hohoho",
                    "huhuhu"
                ],
                "default": "hahaha"
            },
            "varStrAdv2": {
                "type": "string",
                "encrypted": false,
                "title": "Var String Adv2",
                "oneOf": [
                    {
                        "encrypted": false,
                        "title": "HAHAHA",
                        "const": "hahaha"
                    },
                    {
                        "encrypted": false,
                        "title": "HOHOHO",
                        "const": "hohoho"
                    },
                    {
                        "encrypted": false,
                        "title": "HUHUHU",
                        "const": "huhuhu"
                    }
                ],
                "default": "hahaha"
            },
            "varArrayStr": {
                "type": "array",
                "encrypted": false,
                "title": "Var Array Str",
                "items": {
                    "type": "string",
                    "encrypted": false
                },
                "default": [
                    "hahaha"
                ]
            },
            "varReadOnly": {
                "type": "string",
                "encrypted": false,
                "title": "Var Read Only",
                "readOnly": true,
                "default": "read_only"
            },
            "varEncrypted": {
                "type": "string",
                "encrypted": true,
                "title": "Var Encrypted"
            },
            "varArrayObject": {
                "type": "array",
                "encrypted": false,
                "title": "Var Array Object",
                "items": {
                    "type": "object",
                    "encrypted": false,
                    "title": "Var Object",
                    "properties": {
                        "varNum": {
                            "type": "number",
                            "encrypted": false,
                            "title": "Var Num"
                        },
                        "varStr": {
                            "type": "string",
                            "encrypted": false,
                            "title": "Var Str"
                        }
                    }
                }
            },
            "varArrayStrEnum": {
                "type": "array",
                "encrypted": false,
                "title": "Var Array Str",
                "items": {
                    "type": "string",
                    "encrypted": false,
                    "enum": [
                        "hahaha",
                        "hohoho",
                        "huhuhu"
                    ]
                },
                "default": [
                    "hahaha"
                ]
            }
        },
        "required": [
            "varArrayObject",
            "varNum",
            "varStr",
            "varEncrypted",
            "varInt",
            "varObject"
        ]
    },
    "formId": "3ba109d1-2f14-4b89-8e4d-648a9321adcd",
    "externalId": "/blueprint/api/blueprints/521fda0f-cc01-4b12-a822-7979be52fff8"
}