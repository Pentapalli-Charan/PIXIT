import os
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from .serializers import UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

class UploadImageView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        image_file = request.FILES.get('image')
        style = request.data.get('style', 'default')

        if not image_file:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Save the original image
        fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'uploads'))
        filename = fs.save(image_file.name, image_file)
        file_path = os.path.join(settings.MEDIA_ROOT, 'uploads', filename)

        try:
            from PIL import Image
            from .image_service import (
                create_pencil_sketch_effect, 
                create_pencil_color_effect, 
                create_classic_cartoon_effect
            )

            img = Image.open(file_path)

            if style == 'pencil':
                processed_img = create_pencil_sketch_effect(img)
            elif style == 'pencil_color':
                processed_img = create_pencil_color_effect(img)
            elif style == 'ghibli':
                # Approximate aesthetic Ghibli style using bilateral filters and high color quantization
                processed_img = create_classic_cartoon_effect(img, intensity="Light", k=16, blur_d=11, sigma_c=80)
            elif style == 'aesthetic':
                # Abstract, vibrant aesthetic
                processed_img = create_classic_cartoon_effect(img, intensity="Strong", thick_edges=True)
            else:
                # Default cartoon
                processed_img = create_classic_cartoon_effect(img, intensity="Medium")

            processed_filename = f"styled_{filename}"
            processed_path = os.path.join(settings.MEDIA_ROOT, 'uploads', processed_filename)
            processed_img.save(processed_path)
            
            processed_url = request.build_absolute_uri(settings.MEDIA_URL + f'uploads/{processed_filename}')
            
        except Exception as e:
            return Response({"error": f"Image processing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "success": True, 
            "message": "Image processed successfully!",
            "original_url": request.build_absolute_uri(settings.MEDIA_URL + f'uploads/{filename}'),
            "processed_url": processed_url,
            "style": style
        }, status=status.HTTP_200_OK)
