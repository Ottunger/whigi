@echo off

call node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments clients\standalone\app\app.module.ts
call node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments clients\standalone\app\main.ts

call node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments whigi\data.ts
call node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments whigi\user.ts

call node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments whigi-restore\mapping.ts

call node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments utils\checks.ts
call node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments utils\utils.ts

call node_modules\.bin\tsc --experimentalDecorators --emitDecoratorMetadata --removeComments tests\backend\FakeRes.ts


pause