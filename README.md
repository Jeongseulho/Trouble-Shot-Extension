# Trouble Shot in VS Code

## 🌊 Features

### store error log history

![에러로그검출](https://github.com/Jeongseulho/sh-snippets/assets/110578739/d184b7ed-6b8b-4844-87d6-be2d0d85b46b)

- when save file, detect error log and store it in history

### detect node dependency

- if package.json in root directory, detect node dependency and store it

### create trouble

![트러블슈팅만들기](https://github.com/Jeongseulho/sh-snippets/assets/110578739/ef4c77bc-54da-47fa-b7c7-771e942edabc)

- create trouble docs easily, add node dependency automatically
- if create trouble using error log, detect error message and code automatically

### solve trouble

![AI솔루션추천](https://github.com/Jeongseulho/sh-snippets/assets/110578739/56c21894-2c52-497f-aca9-8c64c72e1450)

- you can solve trouble at trouble docs also, and you can get AI solution recommendation

### trouble shooting feedback using AI

![피드백](https://github.com/Jeongseulho/sh-snippets/assets/110578739/498e5ee4-5c2c-43f2-8d30-ed641a95c514)

- you can feedback trouble shooting docs using AI

## 🚀 How to start

1. Install this extension.
2. Open your project in VS Code.
3. To Activate this extension, Click `Trouble Shot` in the left side bar.

## ❗️ Constraints

This extension is prototype. So, there are some constraints.

1. Only support React(TS or JS) project, which is created by `create-react-app`.
2. npm run build command must be in the package.json.
3. package.json must be in the root directory.
4. Some Error is not handled.

## 📝 License

MIT
