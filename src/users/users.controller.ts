import { Controller, Get, UseGuards, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: Partial<User>) {
    return this.usersService.findOne(user.id);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Patch('me')
  updateProfile(
    @CurrentUser() user: Partial<User>,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, dto);
  }
}
