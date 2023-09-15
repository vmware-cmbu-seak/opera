var form = {
    "model": {
        "layout": {
            "pages": [
                {
                    "id": "page_general",
                    "title": "General",
                    "sections": [
                        {
                            "id": "section_project",
                            "fields": [
                                {
                                    "id": "project",
                                    "display": "dropDown",
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_deploymentName",
                            "fields": [
                                {
                                    "id": "deploymentName",
                                    "display": "textField",
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_6eab7586",
                            "fields": [
                                {
                                    "id": "varBoolean",
                                    "display": "checkbox",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                },
                                {
                                    "id": "varInt",
                                    "display": "integerField",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_2003e162",
                            "fields": [
                                {
                                    "id": "varNum",
                                    "display": "decimalField",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                },
                                {
                                    "id": "varNumAdv",
                                    "display": "decimalField",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_varStr",
                            "fields": [
                                {
                                    "id": "varStr",
                                    "display": "textField",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_12e74824",
                            "fields": [
                                {
                                    "id": "varStrAdv1",
                                    "display": "dropDown",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                },
                                {
                                    "id": "varStrAdv2",
                                    "display": "dropDown",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_varObject",
                            "fields": [
                                {
                                    "id": "varObject",
                                    "display": "objectField",
                                    "nestedFields": [
                                        {
                                            "id": "varStr",
                                            "display": "textField",
                                            "state": {
                                                "visible": true,
                                                "read-only": false
                                            },
                                            "signpostPosition": "right-middle"
                                        },
                                        {
                                            "id": "varNum",
                                            "display": "decimalField",
                                            "state": {
                                                "visible": true,
                                                "read-only": false
                                            },
                                            "signpostPosition": "right-middle"
                                        }
                                    ],
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_varArrayStr",
                            "fields": [
                                {
                                    "id": "varArrayStr",
                                    "display": "array",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_varReadOnly",
                            "fields": [
                                {
                                    "id": "varReadOnly",
                                    "display": "textField",
                                    "state": {
                                        "visible": true,
                                        "read-only": true
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_varEncrypted",
                            "fields": [
                                {
                                    "id": "varEncrypted",
                                    "display": "passwordField",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_varArrayObject",
                            "fields": [
                                {
                                    "id": "varArrayObject",
                                    "display": "datagrid",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        },
                        {
                            "id": "section_varArrayStrEnum",
                            "fields": [
                                {
                                    "id": "varArrayStrEnum",
                                    "display": "multiSelect",
                                    "state": {
                                        "visible": true,
                                        "read-only": false
                                    },
                                    "signpostPosition": "right-middle"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "schema": {
            "varInt": {
                "label": "Var Int",
                "type": {
                    "dataType": "integer",
                    "isMultiple": false
                },
                "constraints": {
                    "required": true
                }
            },
            "varNum": {
                "label": "Var Num",
                "type": {
                    "dataType": "decimal",
                    "isMultiple": false
                },
                "constraints": {
                    "required": true
                }
            },
            "varStr": {
                "label": "Var String",
                "type": {
                    "dataType": "string",
                    "isMultiple": false
                },
                "constraints": {
                    "required": true
                }
            },
            "project": {
                "label": "Project",
                "type": {
                    "dataType": "string",
                    "isMultiple": false
                },
                "valueList": {
                    "id": "projects",
                    "type": "scriptAction"
                },
                "constraints": {
                    "required": true
                }
            },
            "varNumAdv": {
                "label": "Var Num Adv",
                "type": {
                    "dataType": "decimal",
                    "isMultiple": false
                },
                "default": 5,
                "constraints": {
                    "max-value": 100,
                    "min-value": 1
                }
            },
            "varObject": {
                "label": "Var Object",
                "type": {
                    "dataType": "complex",
                    "fields": [
                        {
                            "label": "Var Str",
                            "type": {
                                "dataType": "string",
                                "isMultiple": false
                            },
                            "id": "varStr"
                        },
                        {
                            "label": "Var Num",
                            "type": {
                                "dataType": "decimal",
                                "isMultiple": false
                            },
                            "id": "varNum"
                        }
                    ],
                    "isMultiple": false
                },
                "constraints": {
                    "required": true
                }
            },
            "varBoolean": {
                "label": "Var Boolean",
                "type": {
                    "dataType": "boolean",
                    "isMultiple": false
                },
                "default": true
            },
            "varStrAdv1": {
                "label": "Var String Adv1",
                "type": {
                    "dataType": "string",
                    "isMultiple": false
                },
                "default": "hahaha",
                "valueList": [
                    {
                        "label": "hahaha",
                        "value": "hahaha"
                    },
                    {
                        "label": "hohoho",
                        "value": "hohoho"
                    },
                    {
                        "label": "huhuhu",
                        "value": "huhuhu"
                    }
                ]
            },
            "varStrAdv2": {
                "label": "Var String Adv2",
                "type": {
                    "dataType": "string",
                    "isMultiple": false
                },
                "default": "hahaha",
                "valueList": [
                    {
                        "label": "HAHAHA",
                        "value": "hahaha"
                    },
                    {
                        "label": "HOHOHO",
                        "value": "hohoho"
                    },
                    {
                        "label": "HUHUHU",
                        "value": "huhuhu"
                    }
                ]
            },
            "varArrayStr": {
                "label": "Var Array Str",
                "type": {
                    "dataType": "string",
                    "isMultiple": true
                },
                "default": [
                    "hahaha"
                ]
            },
            "varReadOnly": {
                "label": "Var Read Only",
                "type": {
                    "dataType": "string",
                    "isMultiple": false
                },
                "default": "read_only"
            },
            "varEncrypted": {
                "label": "Var Encrypted",
                "type": {
                    "dataType": "secureString",
                    "isMultiple": false
                },
                "constraints": {
                    "required": true
                }
            },
            "deploymentName": {
                "label": "Deployment Name",
                "type": {
                    "dataType": "string",
                    "isMultiple": false
                },
                "constraints": {
                    "required": true,
                    "max-value": 900
                }
            },
            "varArrayObject": {
                "label": "Var Array Object",
                "type": {
                    "dataType": "complex",
                    "fields": [
                        {
                            "label": "Var Str",
                            "type": {
                                "dataType": "string",
                                "isMultiple": false
                            },
                            "id": "varStr"
                        },
                        {
                            "label": "Var Num",
                            "type": {
                                "dataType": "decimal",
                                "isMultiple": false
                            },
                            "id": "varNum"
                        }
                    ],
                    "isMultiple": true
                },
                "constraints": {
                    "required": true
                }
            },
            "varArrayStrEnum": {
                "label": "Var Array Str",
                "type": {
                    "dataType": "string",
                    "isMultiple": true
                },
                "default": [
                    "hahaha"
                ],
                "valueList": [
                    {
                        "label": "hahaha",
                        "value": "hahaha"
                    },
                    {
                        "label": "hohoho",
                        "value": "hohoho"
                    },
                    {
                        "label": "huhuhu",
                        "value": "huhuhu"
                    }
                ]
            }
        },
        "options": {
            "externalValidations": []
        }
    },
    "formStatus": "ON"
}