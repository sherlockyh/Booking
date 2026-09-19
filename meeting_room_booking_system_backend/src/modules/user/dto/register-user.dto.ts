import { IsEmail, IsNotEmpty, IsUUID, MaxLength, MinLength } from "class-validator";

export class RegisterUserDto {

    @IsNotEmpty({
        message: "用户名不能为空"
    })
    username: string;
    
    @IsNotEmpty({
        message: '昵称不能为空'
    })
    nickName: string;
    
    @IsNotEmpty({
        message: '密码不能为空'
    })
    @MinLength(6, {
        message: '密码不能少于 6 位'
    })
    @MaxLength(50, {
        message: '密码最长为 50 字符'
    })
    password: string;
    
    @IsNotEmpty({
        message: '邮箱不能为空'
    })
    @IsEmail({}, {
        message: '不是合法的邮箱格式'
    })
    email: string;

    @IsNotEmpty({
        message: '验证码标识不能为空'
    })
    @IsUUID(undefined, {
        message: '验证码标识格式不正确'
    })
    captchaId: string;
    
    @IsNotEmpty({
        message: '验证码不能为空'
    })
    captcha: string;
}
