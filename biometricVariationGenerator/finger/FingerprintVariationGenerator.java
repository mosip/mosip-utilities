import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.awt.image.BufferedImageOp;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.awt.image.RescaleOp;
import java.io.File;
import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Random;
import java.util.function.BiFunction;
import java.util.List;
import javax.imageio.ImageIO;
import java.awt.geom.AffineTransform;
import java.awt.image.WritableRaster;
import java.util.Queue;

public class FingerprintVariationGenerator {
    static String strFingervariation = "Original";

    public static final int WET_FINGER = 1 << 0; // 00000001
    public static final int SOFT_FINGER = 1 << 1; // 00000010
    public static final int ROUGH_FINGER = 1 << 2; // 00000100
    public static final int TREMBLING_FINGERS = 1 << 3; // 00001000
    public static final int COLD_FINGERS = 1 << 4; // 00010000
    public static final int SLIM_FINGERS = 1 << 5; // 00100000
    public static final int LONG_FINGERS = 1 << 6; // 01000000
    public static final int SHORT_FINGERS = 1 << 7; // 10000000
    public static final int THICK_FINGERS = 1 << 8; // 00000001 00000000
    public static final int NIMBLE_FINGERS = 1 << 9; // 00000010 00000000
    public static final int STIFF_FINGERS = 1 << 10; // 00000100 00000000
    public static final int FLEXIBLE_FINGERS = 1 << 11; // 00001000 00000000
    public static final int CALLOUSED_FINGERS = 1 << 12; // 00010000 00000000
    public static final int SMOOTH_FINGERS = 1 << 13; // 00100000 00000000
    public static final int CURVED_FINGERS = 1 << 14; // 01000000 00000000
    public static final int STRAIGHT_FINGERS = 1 << 15; // 10000000 00000000
    public static final int STRONG_FINGERS = 1 << 16; // 00000001 00000000 00000000
    public static final int BLISTERED_FINGERS = 1 << 17; // 00000010 00000000 00000000
    public static final int DELICATE_FINGERS = 1 << 18; // 00000100 00000000 00000000
    public static final int SWOLLEN_FINGERS = 1 << 19; // 00001000 00000000 00000000
    public static final int SENSITIVE_FINGERS = 1 << 20; // 00010000 00000000 00000000
    public static final int STEADY_FINGERS = 1 << 21; // 00100000 00000000 00000000

    // Variable to store the combination of variations
    public static int fingerPrintVariations = 0;

    public static void main(String[] args) throws IOException {

        // Check if the correct number of arguments is provided
        if (args.length < 2) {
            System.out.println("Usage: java FingerprintVariationGenerator <inputFPTemplateDirectoryPath> <outputUniqueFingerprintDataPath>");
            return;
        }
                
        /// Provide folder where the base template image present
        String inputFPTemplateDirectoryPath = args[0]; //"C:\\Users\\sivan\\Downloads\\SynData\\template\\fp_data";

        /// Provide folder to where the generated variant images should be copied
        String outputUniqueFingerprintDataPath = args[1]; //"C:\\Users\\sivan\\Downloads\\SynData\\output\\fp_data";

        generateFingerprintVariations(inputFPTemplateDirectoryPath, outputUniqueFingerprintDataPath);
    }


    /**************************************************************
     * Generates mutlple variations based on the provided
     * input image and copies to the target folder
     ****************************************************************/
    public static void generateFingerprintVariations(String inputFPTemplateDirectoryPath,
            String outputUniqueFingerprintDataPath) {
        resetFPVariations();

        // Set multiple variations at once
        setFPVariations(WET_FINGER | SOFT_FINGER | ROUGH_FINGER | TREMBLING_FINGERS | COLD_FINGERS | SLIM_FINGERS
                | LONG_FINGERS | SHORT_FINGERS | THICK_FINGERS | NIMBLE_FINGERS | STIFF_FINGERS | FLEXIBLE_FINGERS
                | CALLOUSED_FINGERS
                | SMOOTH_FINGERS | CURVED_FINGERS | STRAIGHT_FINGERS | STRONG_FINGERS | BLISTERED_FINGERS
                | DELICATE_FINGERS
                | SWOLLEN_FINGERS | SENSITIVE_FINGERS | STEADY_FINGERS);

        try {
            // Get all file names in the directory and subdirectories
            List<String> fileNameAbsPaths = listFiles(inputFPTemplateDirectoryPath);

            // Print all file names
            for (String fileNameAbsPath : fileNameAbsPaths) {
                // Convert the string path to a Path object
                Path path = Paths.get(fileNameAbsPath);

                // Get the file name
                String fileName = path.getFileName().toString();

                // Get the parent directory of the file
                Path parentPath = path.getParent();

                // Extract the last two segments from the parent path
                String segment1 = parentPath.getName(parentPath.getNameCount() - 2).toString();
                String segment2 = parentPath.getName(parentPath.getNameCount() - 1).toString();

                // Combine the segments to get the desired output
                String extractedPath = String.join(File.separator, segment1, segment2) + File.separator; 

                // System.out.println("fileNameAbsPath: " + fileNameAbsPath + "
                // outputUniqueFingerprintDataPath : " + outputUniqueFingerprintDataPath + "
                // extractedPath : " + extractedPath + " File Name: " + fileName);

                generateFingerprintVariations(fileNameAbsPath, outputUniqueFingerprintDataPath, extractedPath,
                        fileName);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // Method to set multiple variations
    public static void setFPVariations(int variations) {
        fingerPrintVariations |= variations;
    }

    // Method to reset all variations
    public static void resetFPVariations() {
        fingerPrintVariations = 0;
    }

    // Method to check if a specific variation is set
    public static boolean isVariationSet(int variation) {
        return (fingerPrintVariations & variation) != 0;
    }

    public static void generateFingerprintVariations(String fileNameAbsPath,
            String outputUniqueFingerprintDataRelativePath, String FPPath, String FileName) {

        // Create a list of active Variations based on boolean flags
        List<BiFunction<BufferedImage, Integer, BufferedImage>> activeVariations = new ArrayList<>();

        if (isVariationSet(WET_FINGER))
            activeVariations.add(FingerprintVariationGenerator::applyWetFingerprintVariation);
        if (isVariationSet(SOFT_FINGER))
            activeVariations.add(FingerprintVariationGenerator::applySoftFingerprintVariation);
        if (isVariationSet(ROUGH_FINGER))
            activeVariations.add(FingerprintVariationGenerator::applyRoughFingerprintVariation);
        if (isVariationSet(TREMBLING_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyBlurryFingerprintVariation);
        if (isVariationSet(COLD_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyColdFingerprintVariation);
        if (isVariationSet(SLIM_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applySlimFingerprintVariation);
        if (isVariationSet(LONG_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyLongFingerprintVariation);
        if (isVariationSet(SHORT_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyShortFingerprintVariation);
        if (isVariationSet(THICK_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyThickFingerprintVariation);
        if (isVariationSet(NIMBLE_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyNimbleFingerprintVariation);
        if (isVariationSet(STIFF_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyStiffFingerprintVariation);
        if (isVariationSet(FLEXIBLE_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyFlexibleFingerprintVariation);
        if (isVariationSet(CALLOUSED_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyCallousedFingerprintVariation);
        if (isVariationSet(SMOOTH_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applySmoothFingerprintVariation);
        if (isVariationSet(CURVED_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyCurvedFingerprintVariation);
        if (isVariationSet(STRAIGHT_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyStraightFingerprintVariation);
        if (isVariationSet(STRONG_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyStrongFingerprintVariation);
        if (isVariationSet(BLISTERED_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyBlisteredFingerprintVariation);
        if (isVariationSet(DELICATE_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyDelicateFingerprintVariation);
        if (isVariationSet(SWOLLEN_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applySwollenFingerprintVariation);
        if (isVariationSet(SENSITIVE_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applySensitiveFingerprintVariation);
        if (isVariationSet(STEADY_FINGERS))
            activeVariations.add(FingerprintVariationGenerator::applyApplyFingerprintVariation);

        // Load the original fingerprint image
        BufferedImage fingerprintImage = null;
        try {
            // fingerprintImage = ImageIO.read(new
            fingerprintImage = ImageIO.read(new File(fileNameAbsPath));
        } catch (IOException e) {
            // Handle the exception (e.g., log it, notify the user, etc.)
            e.printStackTrace();
            return;
        }

        if (fingerprintImage == null) {
            System.out.println("Failed to load fingerprint image.");
            return;
        }

        strFingervariation = "Original";
        String outputFingerprintPath = Paths.get(outputUniqueFingerprintDataRelativePath, FPPath, strFingervariation + "_" + FileName).toString();

        // Create directories if they do not exist
        Path outputPath = Paths.get(outputFingerprintPath).getParent();

        // First copy the original image as well
        try {
            if (!Files.exists(outputPath)) {
                Files.createDirectories(outputPath);
            }
            ImageIO.write(fingerprintImage, "png", new File(outputFingerprintPath));
        } catch (IOException e) {
            System.err.println(e.getMessage());
            return;
        }

        // Apply the Variations and genearate varations for this profile
        for (int j = 1; j <= activeVariations.size(); j++) {
            BiFunction<BufferedImage, Integer, BufferedImage> Variation = activeVariations
                    .get((j - 1) % activeVariations.size());
            BufferedImage fingerprintImageWithVariation = Variation.apply(fingerprintImage, j);

            fingerprintImageWithVariation = postProcessFingerprint(fingerprintImageWithVariation);

            outputFingerprintPath = Paths.get(outputUniqueFingerprintDataRelativePath, FPPath, strFingervariation + "_" + FileName).toString();        

            try {
                ImageIO.write(fingerprintImageWithVariation, "png", new File(outputFingerprintPath));
            } catch (IOException e) {
                // Handle the exception (e.g., log it, notify the user, etc.)
                e.printStackTrace();
                System.err.println(e.getMessage());
            }
        }
    }

    public static List<String> listFiles(String directoryPath) throws IOException {
        List<String> fileNames = new ArrayList<>();

        // Start walking through the file tree
        Files.walkFileTree(Paths.get(directoryPath), new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                // Add the file name to the list
                fileNames.add(file.toString());
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc) throws IOException {
                // If a file visit fails, print the error and continue
                System.err.println("Failed to access file: " + file.toString() + " (" + exc.getMessage() + ")");
                return FileVisitResult.CONTINUE;
            }
        });
        return fileNames;
    }

    /**************************************************************
     * Functionality to apply white color for non finger print area
     ****************************************************************/
    public static BufferedImage postProcessFingerprint(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();

        // Convert image to grayscale
        BufferedImage grayImage = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int gray = (int)(0.299 * ((rgb >> 16) & 0xFF) + 0.587 * ((rgb >> 8) & 0xFF) + 0.114 * (rgb & 0xFF));
                grayImage.setRGB(x, y, new Color(gray, gray, gray).getRGB());
            }
        }

        // Edge detection using Sobel operator
        BufferedImage edgeImage = applySobelOperator(grayImage);

        // Adaptive thresholding
        BufferedImage thresholdedImage = applyAdaptiveThreshold(edgeImage);

        // Flood fill to isolate the finger area
        BufferedImage filledImage = floodFill(thresholdedImage);

        // Combine with the original image
        BufferedImage processedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int filledPixel = new Color(filledImage.getRGB(x, y)).getRed();
                if (filledPixel == 255) {
                    processedImage.setRGB(x, y, Color.WHITE.getRGB());
                } else {
                    processedImage.setRGB(x, y, image.getRGB(x, y));
                }
            }
        }

        return processedImage;
    }

    private static BufferedImage applySobelOperator(BufferedImage grayImage) {
        int width = grayImage.getWidth();
        int height = grayImage.getHeight();
        BufferedImage edgeImage = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);

        int[] sobelX = {-1, 0, 1, -2, 0, 2, -1, 0, 1};
        int[] sobelY = {-1, -2, -1, 0, 0, 0, 1, 2, 1};

        for (int y = 1; y < height - 1; y++) {
            for (int x = 1; x < width - 1; x++) {
                int gx = 0;
                int gy = 0;
                for (int i = -1; i <= 1; i++) {
                    for (int j = -1; j <= 1; j++) {
                        int pixel = new Color(grayImage.getRGB(x + j, y + i)).getRed();
                        gx += sobelX[(i + 1) * 3 + (j + 1)] * pixel;
                        gy += sobelY[(i + 1) * 3 + (j + 1)] * pixel;
                    }
                }
                int edgeValue = (int) Math.min(255, Math.sqrt(gx * gx + gy * gy));
                edgeImage.setRGB(x, y, new Color(edgeValue, edgeValue, edgeValue).getRGB());
            }
        }

        return edgeImage;
    }

    private static BufferedImage applyAdaptiveThreshold(BufferedImage edgeImage) {
        int width = edgeImage.getWidth();
        int height = edgeImage.getHeight();
        BufferedImage thresholdedImage = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_BINARY);

        int blockSize = 15;
        int constant = 10;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int pixelValue = new Color(edgeImage.getRGB(x, y)).getRed();
                int localMean = calculateLocalMean(edgeImage, x, y, blockSize);
                if (pixelValue < localMean - constant) {
                    thresholdedImage.setRGB(x, y, Color.BLACK.getRGB());
                } else {
                    thresholdedImage.setRGB(x, y, Color.WHITE.getRGB());
                }
            }
        }

        return thresholdedImage;
    }

    private static int calculateLocalMean(BufferedImage image, int x, int y, int blockSize) {
        int sum = 0;
        int count = 0;

        int halfSize = blockSize / 2;
        for (int i = -halfSize; i <= halfSize; i++) {
            for (int j = -halfSize; j <= halfSize; j++) {
                int xi = Math.min(Math.max(x + i, 0), image.getWidth() - 1);
                int yj = Math.min(Math.max(y + j, 0), image.getHeight() - 1);
                sum += new Color(image.getRGB(xi, yj)).getRed();
                count++;
            }
        }

        return sum / count;
    }

    private static BufferedImage floodFill(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage filledImage = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_BINARY);

        int backgroundColor = Color.WHITE.getRGB();
        int targetColor = Color.BLACK.getRGB();
        int fillColor = Color.BLACK.getRGB();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (image.getRGB(x, y) == targetColor) {
                    floodFillHelper(image, filledImage, x, y, targetColor, fillColor, backgroundColor);
                }
            }
        }

        return filledImage;
    }

    private static void floodFillHelper(BufferedImage image, BufferedImage filledImage, int x, int y, int targetColor, int fillColor, int backgroundColor) {
        int width = image.getWidth();
        int height = image.getHeight();

        Queue<int[]> queue = new LinkedList<>();
        queue.add(new int[]{x, y});

        while (!queue.isEmpty()) {
            int[] point = queue.remove();
            int px = point[0];
            int py = point[1];

            if (px < 0 || px >= width || py < 0 || py >= height) continue;

            if (image.getRGB(px, py) == targetColor && filledImage.getRGB(px, py) != fillColor) {
                filledImage.setRGB(px, py, fillColor);
                queue.add(new int[]{px - 1, py});
                queue.add(new int[]{px + 1, py});
                queue.add(new int[]{px, py - 1});
                queue.add(new int[]{px, py + 1});
            }
        }
    }



    /**************************************************************
     * Apply Steady finger print Variation
     ****************************************************************/
    private static BufferedImage applyApplyFingerprintVariation(BufferedImage original, int index) {
        strFingervariation = "Steady";
        int width = original.getWidth();
        int height = original.getHeight();

        // Create a new BufferedImage with the same size as the original
        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = result.createGraphics();

        // Fill the background with white
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, width, height);

        // Apply steady transformations
        AffineTransform transform = new AffineTransform();
        Random rand = new Random();

        // Slight rotation (up to 2 degrees)
        double angle = (rand.nextDouble() * 4 - 2) * Math.PI / 180; // Random angle between -2 and 2 degrees
        transform.rotate(angle, width / 2.0, height / 2.0);

        // Slight scaling (between 0.95 and 1.05)
        double scale = 0.95 + rand.nextDouble() * 0.1; // Scale between 0.95 and 1.05
        transform.scale(scale, scale);

        // Apply the transformation to the original image
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(original, transform, null);
        g2d.dispose();

        return result;
    }

    /**************************************************************
     * Apply Sensitive finger print Variation
     ****************************************************************/
    private static BufferedImage applySensitiveFingerprintVariation(BufferedImage original, int seed) {
        strFingervariation = "Sensitive";
        int width = original.getWidth();
        int height = original.getHeight();

        // Create a new BufferedImage with the same size as the original
        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = result.createGraphics();

        // Fill the background with white
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, width, height);

        // Apply transformations to simulate sensitivity
        BufferedImage transformedImage = applySensitivityEffects(original);

        // Draw the transformed image onto the white background
        g2d.drawImage(transformedImage, 0, 0, null);
        g2d.dispose();

        return result;
    }

    private static BufferedImage applySensitivityEffects(BufferedImage original) {
        int width = original.getWidth();
        int height = original.getHeight();
        BufferedImage transformedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = transformedImage.createGraphics();

        // Apply subtle sensitivity effects
        Random rand = new Random();
        g2d.drawImage(original, 0, 0, null);
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);

        // Apply slight blur effect to simulate sensitivity
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                // Get the original pixel color
                Color color = new Color(original.getRGB(x, y), true);

                // Apply random color variations
                int red = Math.min(255, Math.max(0, color.getRed() + rand.nextInt(10) - 5));
                int green = Math.min(255, Math.max(0, color.getGreen() + rand.nextInt(10) - 5));
                int blue = Math.min(255, Math.max(0, color.getBlue() + rand.nextInt(10) - 5));

                // Set the new color
                transformedImage.setRGB(x, y, new Color(red, green, blue, color.getAlpha()).getRGB());
            }
        }

        g2d.dispose();
        return transformedImage;
    }

    /**************************************************************
     * Apply Swollen finger print Variation
     ****************************************************************/
    private static BufferedImage applySwollenFingerprintVariation(BufferedImage original, int seed) {
        strFingervariation = "Swollen";
        int width = original.getWidth();
        int height = original.getHeight();

        // Create a new BufferedImage with the same size as the original
        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = result.createGraphics();

        // Fill the background with white
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, width, height);

        // Apply swelling effect
        BufferedImage swollenImage = applySwellingEffect(original);

        // Draw the swollen image onto the white background
        g2d.drawImage(swollenImage, 0, 0, null);
        g2d.dispose();

        return result;
    }

    private static BufferedImage applySwellingEffect(BufferedImage original) {
        int width = original.getWidth();
        int height = original.getHeight();
        BufferedImage swollenImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = swollenImage.createGraphics();

        Random rand = new Random();
        int maxDisplacement = 20; // Max pixel displacement for swelling

        // Apply swelling effect using a distortion algorithm
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                // Apply random displacement to simulate swelling
                int dx = (int) (rand.nextDouble() * maxDisplacement - maxDisplacement / 2);
                int dy = (int) (rand.nextDouble() * maxDisplacement - maxDisplacement / 2);
                int newX = Math.min(Math.max(x + dx, 0), width - 1);
                int newY = Math.min(Math.max(y + dy, 0), height - 1);

                // Get color from original image and set it to the new position
                Color color = new Color(original.getRGB(x, y), true);
                swollenImage.setRGB(newX, newY, color.getRGB());
            }
        }

        g2d.dispose();
        return swollenImage;
    }

    /**************************************************************
     * Apply Delicate finger print Variation
     ****************************************************************/
    private static BufferedImage applyDelicateFingerprintVariation(BufferedImage original, int seed) {
        strFingervariation = "Delicate";
        int width = original.getWidth();
        int height = original.getHeight();

        // Create a new BufferedImage with the same size as the original
        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = result.createGraphics();

        // Fill the background with white
        g2d.setColor(java.awt.Color.WHITE);
        g2d.fillRect(0, 0, width, height);

        // Apply transformations
        AffineTransform transform = new AffineTransform();
        Random rand = new Random();

        // Random rotation
        double angle = rand.nextDouble() * 10 - 5; // Rotation between -5 and 5 degrees
        transform.rotate(Math.toRadians(angle), width / 2.0, height / 2.0);

        // Random scaling
        double scale = 0.9 + (rand.nextDouble() * 0.2); // Scale between 0.9 and 1.1
        transform.scale(scale, scale);

        // Random translation
        double translateX = rand.nextDouble() * 10 - 5; // Translation between -5 and 5 pixels
        double translateY = rand.nextDouble() * 10 - 5; // Translation between -5 and 5 pixels
        transform.translate(translateX, translateY);

        // Apply the transformation to the original image
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(original, transform, null);
        g2d.dispose();

        return result;
    }

    /**************************************************************
     * Apply Blistered finger print Variation
     ****************************************************************/
    private static BufferedImage applyBlisteredFingerprintVariation(BufferedImage original, int seed) {
        strFingervariation = "Blistered";
        int width = original.getWidth();
        int height = original.getHeight();

        // Create a new BufferedImage with the same size as the original
        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = result.createGraphics();

        // Fill the background with white
        g2d.setColor(java.awt.Color.WHITE);
        g2d.fillRect(0, 0, width, height);

        // Apply transformations
        AffineTransform transform = new AffineTransform();
        Random rand = new Random();

        // Random rotation
        double angle = rand.nextDouble() * 360;
        transform.rotate(Math.toRadians(angle), width / 2.0, height / 2.0);

        // Random scaling
        double scaleX = 0.9 + (rand.nextDouble() * 0.2);
        double scaleY = 0.9 + (rand.nextDouble() * 0.2);
        transform.scale(scaleX, scaleY);

        // Random translation
        double translateX = rand.nextDouble() * (width - width * scaleX); // Keep within bounds
        double translateY = rand.nextDouble() * (height - height * scaleY); // Keep within bounds
        transform.translate(translateX, translateY);

        // Apply the transformation to the original image
        Graphics2D g2dImage = (Graphics2D) result.getGraphics();
        g2dImage.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2dImage.drawImage(original, transform, null);
        g2dImage.dispose();

        return result;
    }

    /**************************************************************
     * Apply Strong finger print Variation
     ****************************************************************/
    private static BufferedImage applyStrongFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Strong";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image with the same dimensions as the original
        BufferedImage strongImage = new BufferedImage(width, height, originalImage.getType());

        // Apply the strong effect by enhancing contrast and slightly thickening the
        // ridges
        Graphics2D g2d = strongImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);

        // Vary the contrast and thickness based on the seed
        float scaleFactor = 1.2f + (seed % 10) * 0.02f; // Scale factor varies between 1.2 and 1.4
        float offset = -25.0f * (seed % 5); // Slightly darken the image for a stronger effect

        RescaleOp rescaleOp = new RescaleOp(scaleFactor, offset, null);
        rescaleOp.filter(strongImage, strongImage);

        // Dispose of the Graphics2D context
        g2d.dispose();

        return strongImage;
    }

    /**************************************************************
     * Apply Straight finger print Variation
     ****************************************************************/
    private static BufferedImage applyStraightFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Straight";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image with the same dimensions as the original
        BufferedImage straightImage = new BufferedImage(width, height, originalImage.getType());

        // Apply the straightening effect using an affine transform
        Graphics2D g2d = straightImage.createGraphics();
        AffineTransform transform = new AffineTransform();

        // Vary the straightening factor based on the seed
        double straighteningFactor = 1.0 + (seed % 5) * 0.01; // Scale factor varies slightly for uniqueness

        // Apply a slight vertical or horizontal scaling to enhance linearity
        transform.scale(straighteningFactor, straighteningFactor);
        g2d.drawImage(originalImage, transform, null);

        // Dispose of the Graphics2D context
        g2d.dispose();

        return straightImage;
    }

    /**************************************************************
     * Apply Curved finger print Variation
     ****************************************************************/
    private static BufferedImage applyCurvedFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Curved";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image with the same dimensions as the original
        BufferedImage curvedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);

        // Apply the curved effect using an affine transform
        Graphics2D g2d = curvedImage.createGraphics();
        AffineTransform transform = new AffineTransform();

        // Vary the curvature based on the seed
        double curvatureFactor = 0.0005 * (seed % 10 + 20); // Adjust factor to control the curvature intensity

        // Apply horizontal shear
        transform.setToIdentity();
        transform.shear(curvatureFactor, 0);
        BufferedImage horizontalShearedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2dHorizontal = horizontalShearedImage.createGraphics();
        g2dHorizontal.drawImage(originalImage, transform, null);
        g2dHorizontal.dispose();

        // Apply vertical shear on the horizontally sheared image
        transform.setToIdentity();
        transform.shear(0, curvatureFactor);
        g2d.drawImage(horizontalShearedImage, transform, null);
        g2d.dispose();

        return curvedImage;
    }

    /**************************************************************
     * Apply Smooth finger print Variation
     ****************************************************************/
    private static BufferedImage applySmoothFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Smooth";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image with the same dimensions as the original
        BufferedImage smoothImage = new BufferedImage(width, height, originalImage.getType());

        // Copy the original image to the new image
        Graphics2D g2d = smoothImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);

        // Apply smoothing effect using a blur filter
        float[] blurKernel = {
                1 / 9f, 1 / 9f, 1 / 9f,
                1 / 9f, 1 / 9f, 1 / 9f,
                1 / 9f, 1 / 9f, 1 / 9f
        };

        ConvolveOp convolveOp = new ConvolveOp(new Kernel(3, 3, blurKernel), ConvolveOp.EDGE_NO_OP, null);
        BufferedImage blurredImage = convolveOp.filter(smoothImage, null);

        // Dispose of the Graphics2D context
        g2d.dispose();

        return blurredImage;
    }

    /**************************************************************
     * Apply Calloused finger print Variation
     ****************************************************************/
    private static BufferedImage applyCallousedFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Calloused";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Create a new image with the same dimensions as the original
        BufferedImage callousedImage = new BufferedImage(width, height, originalImage.getType());

        // Copy the original image to the new image
        Graphics2D g2d = callousedImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);

        // Apply calloused effect by adding noise and texture
        Random random = new Random(seed);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                Color originalColor = new Color(originalImage.getRGB(x, y));
                int noise = (int) (random.nextGaussian() * 20); // Adjust the factor to increase roughness

                // Alter the color based on the noise
                int red = clamp(originalColor.getRed() + noise);
                int green = clamp(originalColor.getGreen() + noise);
                int blue = clamp(originalColor.getBlue() + noise);

                Color newColor = new Color(red, green, blue);
                callousedImage.setRGB(x, y, newColor.getRGB());
            }
        }

        g2d.dispose();
        return callousedImage;
    }

    // Helper method to ensure RGB values stay within valid range
    private static int clamp(int value) {
        return Math.max(0, Math.min(255, value));
    }

    /**************************************************************
     * Apply Flexible finger print Variation
     ****************************************************************/
    private static BufferedImage applyFlexibleFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Flexible";
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Create a new image with the same dimensions as the original
        BufferedImage flexibleImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());

        // Apply flexible transformation (e.g., random warping)
        Graphics2D g2d = flexibleImage.createGraphics();
        AffineTransform transform = new AffineTransform();

        Random random = new Random(seed);

        // Simulate flexible deformation by randomly scaling and translating parts of
        // the image
        double scaleX = 1.0 + (random.nextDouble() - 0.5) * 0.1; // Slight horizontal scaling
        double scaleY = 1.0 + (random.nextDouble() - 0.5) * 0.1; // Slight vertical scaling
        double shearX = (random.nextDouble() - 0.5) * 0.05; // Slight horizontal shear
        double shearY = (random.nextDouble() - 0.5) * 0.05; // Slight vertical shear

        transform.scale(scaleX, scaleY);
        transform.shear(shearX, shearY);

        g2d.drawImage(originalImage, transform, null);
        g2d.dispose();

        // Now, create the final image with the same size as the original
        BufferedImage finalImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());
        Graphics2D g2dFinal = finalImage.createGraphics();

        // Set the background color to white
        g2dFinal.setColor(Color.WHITE);
        g2dFinal.fillRect(0, 0, originalWidth, originalHeight);

        // Center the flexible fingerprint on the white background
        int xOffset = (originalWidth - flexibleImage.getWidth()) / 2;
        int yOffset = 0; // No vertical offset, as height is unchanged
        g2dFinal.drawImage(flexibleImage, xOffset, yOffset, null);
        g2dFinal.dispose();

        return finalImage;
    }

    /**************************************************************
     * Apply Stiff finger print Variation
     ****************************************************************/
    private static BufferedImage applyStiffFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Stiff";
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Use seed to slightly vary the stiffening factor for uniqueness
        double stiffeningFactor = 1.0 + (seed % 10) * 0.01; // Slightly modify stiffness by making the fingerprint less
                                                            // curved

        // Create a temporary image for transformation
        BufferedImage stiffImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());

        // Apply the stiffening transformation (e.g., scaling vertically to reduce
        // flexibility)
        Graphics2D g2d = stiffImage.createGraphics();
        AffineTransform transform = new AffineTransform();
        transform.scale(stiffeningFactor, 1.0); // Scale horizontally to reduce curvature
        g2d.drawImage(originalImage, transform, null);
        g2d.dispose();

        // Now, create the final image with the same size as the original
        BufferedImage finalImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());
        Graphics2D g2dFinal = finalImage.createGraphics();

        // Set the background color to white
        g2dFinal.setColor(Color.WHITE);
        g2dFinal.fillRect(0, 0, originalWidth, originalHeight);

        // Center the stiffened fingerprint on the white background
        int xOffset = (originalWidth - stiffImage.getWidth()) / 2;
        int yOffset = 0; // No vertical offset, as height is unchanged
        g2dFinal.drawImage(stiffImage, xOffset, yOffset, null);
        g2dFinal.dispose();

        return finalImage;
    }

    /**************************************************************
     * Apply nimble finger print Variation
     ****************************************************************/
    private static BufferedImage applyNimbleFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Nimble";
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Use seed to slightly vary the slimming factor for uniqueness
        double slimmingFactor = 0.8 + (seed % 10) * 0.01; // Scale factor varies between 0.8 and 0.9

        // Create a temporary image with reduced width to simulate a nimble finger
        BufferedImage slimImage = new BufferedImage((int) (originalWidth * slimmingFactor), originalHeight,
                originalImage.getType());

        // Apply the slimming transformation
        Graphics2D g2d = slimImage.createGraphics();
        AffineTransform transform = new AffineTransform();
        transform.scale(slimmingFactor, 1.0); // Scale horizontally to slim the fingerprint
        g2d.drawImage(originalImage, transform, null);
        g2d.dispose();

        // Now, create the final image with the same size as the original
        BufferedImage finalImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());
        Graphics2D g2dFinal = finalImage.createGraphics();

        // Set the background color to white
        g2dFinal.setColor(Color.WHITE);
        g2dFinal.fillRect(0, 0, originalWidth, originalHeight);

        // Center the slimmed fingerprint on the white background
        int xOffset = (originalWidth - slimImage.getWidth()) / 2;
        int yOffset = 0; // No vertical offset, as height is unchanged
        g2dFinal.drawImage(slimImage, xOffset, yOffset, null);
        g2dFinal.dispose();

        return finalImage;
    }

    /**************************************************************
     * Apply thick finger print Variation
     ****************************************************************/
    private static BufferedImage applyThickFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Thick";

        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Use seed to slightly vary the thickening factor for uniqueness
        double thickeningFactor = 1.2 + (seed % 10) * 0.01; // Scale factor varies between 1.2 and 1.3

        // Create a temporary image with increased width to simulate a thick finger
        BufferedImage thickImage = new BufferedImage((int) (originalWidth * thickeningFactor), originalHeight,
                originalImage.getType());

        // Apply the thickening transformation
        Graphics2D g2d = thickImage.createGraphics();
        AffineTransform transform = new AffineTransform();
        transform.scale(thickeningFactor, 1.0); // Scale horizontally to thicken the fingerprint
        g2d.drawImage(originalImage, transform, null);
        g2d.dispose();

        // Now, create the final image with the same size as the original
        BufferedImage finalImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());
        Graphics2D g2dFinal = finalImage.createGraphics();

        // Set the background color to white
        g2dFinal.setColor(Color.WHITE);
        g2dFinal.fillRect(0, 0, originalWidth, originalHeight);

        // Center the thickened fingerprint on the white background
        int xOffset = (originalWidth - thickImage.getWidth()) / 2;
        int yOffset = 0; // No vertical offset, as height is unchanged
        g2dFinal.drawImage(thickImage, xOffset, yOffset, null);
        g2dFinal.dispose();

        return finalImage;
    }

    /**************************************************************
     * Apply slim finger print Variation
     ****************************************************************/
    private static BufferedImage applySlimFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Slim";
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Use seed to slightly vary the slimming factor for uniqueness
        double slimmingFactor = 0.7 + (seed % 10) * 0.01; // Scale factor varies between 0.7 and 0.8

        // Create a slimmed version of the fingerprint
        int slimWidth = (int) (originalWidth * slimmingFactor);
        BufferedImage slimImage = new BufferedImage(slimWidth, originalHeight, originalImage.getType());

        // Apply the slimming transformation
        Graphics2D g2d = slimImage.createGraphics();
        AffineTransform transform = new AffineTransform();
        transform.scale(slimmingFactor, 1.0); // Scale horizontally to slim the fingerprint
        g2d.drawImage(originalImage, transform, null);
        g2d.dispose();

        // Create a new image with the same dimensions as the original, and fill it with
        // white
        BufferedImage finalImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());
        g2d = finalImage.createGraphics();
        g2d.setColor(Color.WHITE); // Set the background color to white
        g2d.fillRect(0, 0, originalWidth, originalHeight); // Fill the entire canvas with white

        // Center the slimmed fingerprint on the white background
        int xOffset = (originalWidth - slimWidth) / 2; // Calculate x offset to center the slimmed image
        g2d.drawImage(slimImage, xOffset, 0, slimWidth, originalHeight, null);
        g2d.dispose();

        return finalImage;
    }

    /**************************************************************
     * Apply short finger print Variation
     ****************************************************************/
    private static BufferedImage applyShortFingerprintVariation(BufferedImage originalImage, int variationIndex) {
        strFingervariation = "Short";

        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Calculate the new height (shortened fingerprint)
        int newHeight = originalHeight / 2 + (variationIndex % (originalHeight / 4)); // vary the height a bit

        // Resize the fingerprint to the new height
        BufferedImage resizedFingerprintImage = new BufferedImage(originalWidth, newHeight, originalImage.getType());
        Graphics2D g2dResized = resizedFingerprintImage.createGraphics();
        g2dResized.drawImage(originalImage, 0, 0, originalWidth, newHeight, null);
        g2dResized.dispose();

        // Create the final image with white background and same dimensions as the
        // original
        BufferedImage finalImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());
        Graphics2D g2dFinal = finalImage.createGraphics();
        g2dFinal.setColor(Color.WHITE);
        g2dFinal.fillRect(0, 0, originalWidth, originalHeight);

        // Center the short fingerprint on the white background
        int yOffset = (originalHeight - newHeight) / 2;
        g2dFinal.drawImage(resizedFingerprintImage, 0, yOffset, originalWidth, newHeight, null);
        g2dFinal.dispose();

        return finalImage;
    }

    /**************************************************************
     * Apply long finger print Variation
     ****************************************************************/
    private static BufferedImage applyLongFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Long";
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Use seed to slightly vary the elongating factor for uniqueness
        double elongatingFactor = 1.2 + (seed % 10) * 0.01; // Scale factor varies between 1.2 and 1.3

        // Create an elongated version of the fingerprint
        int elongatedWidth = (int) (originalWidth * elongatingFactor);
        BufferedImage elongatedImage = new BufferedImage(elongatedWidth, originalHeight, originalImage.getType());

        // Apply the elongating transformation
        Graphics2D g2d = elongatedImage.createGraphics();
        AffineTransform transform = new AffineTransform();
        transform.scale(elongatingFactor, 1.0); // Scale horizontally to elongate the fingerprint
        g2d.drawImage(originalImage, transform, null);
        g2d.dispose();

        // Create a new image with the same dimensions as the original, and fill it with
        // white
        BufferedImage finalImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());
        g2d = finalImage.createGraphics();
        g2d.setColor(Color.WHITE); // Set the background color to white
        g2d.fillRect(0, 0, originalWidth, originalHeight); // Fill the entire canvas with white

        // Center the elongated fingerprint on the white background
        int xOffset = (originalWidth - elongatedWidth) / 2; // Calculate x offset to center the elongated image
        g2d.drawImage(elongatedImage, xOffset, 0, elongatedWidth, originalHeight, null);
        g2d.dispose();

        return finalImage;
    }

    /**************************************************************
     * Cold finger print Variation
     ****************************************************************/
    private static BufferedImage applyColdFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Cold";
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Step 1: Increase the blurring effect (stronger blur kernel)
        float[] strongBlurKernel = {
                1 / 16f, 1 / 8f, 1 / 16f,
                1 / 8f, 1 / 4f, 1 / 8f,
                1 / 16f, 1 / 8f, 1 / 16f
        };
        ConvolveOp blurOp = new ConvolveOp(new Kernel(3, 3, strongBlurKernel), ConvolveOp.EDGE_NO_OP, null);
        BufferedImage blurredImage = blurOp.filter(originalImage, null);

        // Step 2: Reduce the contrast slightly
        RescaleOp contrastOp = new RescaleOp(0.9f, 15, null); // Scale down brightness by 10% and add a small offset
        BufferedImage lowContrastImage = contrastOp.filter(blurredImage, null);

        // Step 3: Add noise to simulate the "coldfinger" effect
        BufferedImage noisyImage = addNoise(lowContrastImage, seed);

        // Step 4: Create the final image with white background and same dimensions
        BufferedImage finalImage = new BufferedImage(originalWidth, originalHeight, originalImage.getType());
        Graphics2D g2d = finalImage.createGraphics();
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, originalWidth, originalHeight);

        // Center the cold fingerprint on the white background
        g2d.drawImage(noisyImage, 0, 0, originalWidth, originalHeight, null);
        g2d.dispose();

        return finalImage;
    }

    private static BufferedImage addNoise(BufferedImage image, int seed) {
        Random rand = new Random(seed);
        int width = image.getWidth();
        int height = image.getHeight();

        BufferedImage noisyImage = new BufferedImage(width, height, image.getType());
        Graphics2D g2d = noisyImage.createGraphics();
        g2d.drawImage(image, 0, 0, null);

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int noise = rand.nextInt(20) - 10; // Random noise between -10 and 10
                int r = Math.max(0, Math.min(255, ((rgb >> 16) & 0xFF) + noise));
                int g = Math.max(0, Math.min(255, ((rgb >> 8) & 0xFF) + noise));
                int b = Math.max(0, Math.min(255, (rgb & 0xFF) + noise));
                noisyImage.setRGB(x, y, new Color(r, g, b).getRGB());
            }
        }
        g2d.dispose();
        return noisyImage;
    }

    /**************************************************************
     * Wet finger print Variation
     ****************************************************************/
    private static BufferedImage applyWetFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Wet";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        BufferedImage wetFingerprint = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = wetFingerprint.createGraphics();
        g.drawImage(originalImage, 0, 0, null);
        g.dispose();
    
        Random random = new Random(seed);
    
        // Darken fingerprint area before applying effects
        darkenFingerprintArea(wetFingerprint);
    
        // Add dark patches to simulate uneven moisture
        addDarkPatches(wetFingerprint, random);
    
        // Apply blur to simulate smudging
        //applyBlur(wetFingerprint, random);
    
        // Add noise to simulate water droplets or uneven moisture
        applyNoise(wetFingerprint, random);
    
        // Apply smudges to simulate finger movement on the scanner
        applySmudges(wetFingerprint, random);
    
        return wetFingerprint;
    }
    
    private static void darkenFingerprintArea(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
    
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int pixelValue = new Color(image.getRGB(x, y)).getRed();
    
                // Only darken the fingerprint area, which is typically the darker part of the image
                if (pixelValue < 200) {
                    int darkenedValue = (int) (pixelValue * 0.25); // Make it 4 times darker
                    Color darkenedColor = new Color(darkenedValue, darkenedValue, darkenedValue);
                    image.setRGB(x, y, darkenedColor.getRGB());
                }
            }
        }
    }
    
    private static void addDarkPatches(BufferedImage image, Random random) {
        int width = image.getWidth();
        int height = image.getHeight();
        Graphics2D g = image.createGraphics();
    
        int numPatches = random.nextInt(15) + 10; // Random number of dark patches
        for (int i = 0; i < numPatches; i++) {
            int patchWidth = random.nextInt(20) + 10;
            int patchHeight = random.nextInt(20) + 10;
            int x = random.nextInt(width - patchWidth);
            int y = random.nextInt(height - patchHeight);
    
            // Set patch color to full black
            Color patchColor = new Color(0, 0, 0, 150);
    
            g.setColor(patchColor);
            g.fillOval(x, y, patchWidth, patchHeight);
        }
    
        g.dispose();
    }
    
    private static void applyBlur(BufferedImage image, Random random) {
        float[] blurKernel = new float[9];
        float blurFactor = random.nextFloat() * 0.5f + 0.5f; // Random blur intensity
        for (int i = 0; i < 9; i++) {
            blurKernel[i] = blurFactor / 9;
        }
        BufferedImageOp blurOp = new ConvolveOp(new Kernel(3, 3, blurKernel));
        BufferedImage blurredImage = blurOp.filter(image, null);
        Graphics2D g = image.createGraphics();
        g.drawImage(blurredImage, 0, 0, null);
        g.dispose();
    }
    
    private static void applyNoise(BufferedImage image, Random random) {
        int width = image.getWidth();
        int height = image.getHeight();
    
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int pixelValue = new Color(image.getRGB(x, y)).getRed();
                int noise = (int) (random.nextGaussian() * 20); // Random noise intensity
                int newPixelValue = Math.max(0, Math.min(255, pixelValue + noise));
                Color newColor = new Color(newPixelValue, newPixelValue, newPixelValue);
                image.setRGB(x, y, newColor.getRGB());
            }
        }
    }
    
    private static void applySmudges(BufferedImage image, Random random) {
        int width = image.getWidth();
        int height = image.getHeight();
        Graphics2D g = image.createGraphics();
    
        int numSmudges = random.nextInt(10) + 5; // Random number of smudges
        for (int i = 0; i < numSmudges; i++) {
            int smudgeWidth = random.nextInt(30) + 20;
            int smudgeHeight = random.nextInt(10) + 5;
            int x = random.nextInt(width - smudgeWidth);
            int y = random.nextInt(height - smudgeHeight);
            int smudgeGrayLevel = random.nextInt(50) + 200;
            Color smudgeColor = new Color(smudgeGrayLevel, smudgeGrayLevel, smudgeGrayLevel, 80);
    
            g.setColor(smudgeColor);
            g.fillOval(x, y, smudgeWidth, smudgeHeight);
        }
    
        g.dispose();
    }
    
    /**************************************************************
     * Rougher finger print Variation
     ****************************************************************/
    private static BufferedImage applyRoughFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Rough";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        BufferedImage uniqueRoughFingerprint = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = uniqueRoughFingerprint.createGraphics();
        g.drawImage(originalImage, 0, 0, null);
        g.dispose();

        Random random = new Random(seed);

        // Randomly distort the image
        // applyRandomDistortion(uniqueRoughFingerprint, random);

        // Randomly vary the contrast and brightness
        randomizeContrastAndBrightness(uniqueRoughFingerprint, random);

        // Apply stronger sharpening and randomize intensity
        // applyRandomizedSharpening(uniqueRoughFingerprint, random);

        // Add stronger and more complex texture/noise
        applyComplexTexture(uniqueRoughFingerprint, random);

        return uniqueRoughFingerprint;
    }

    private static void applyRandomDistortion(BufferedImage image, Random random) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage distortedImage = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = distortedImage.createGraphics();

        // Apply random affine transformations
        AffineTransform transform = new AffineTransform();
        double angle = random.nextDouble() * Math.PI / 6 - Math.PI / 12; // Rotate between -15 and 15 degrees
        double scale = 1 + (random.nextDouble() * 0.2 - 0.1); // Scale between 0.9 and 1.1
        transform.rotate(angle, width / 2, height / 2);
        transform.scale(scale, scale);
        g.drawImage(image, transform, null);
        g.dispose();

        // Copy back the distorted image
        Graphics2D g2 = image.createGraphics();
        g2.drawImage(distortedImage, 0, 0, null);
        g2.dispose();
    }

    private static void randomizeContrastAndBrightness(BufferedImage image, Random random) {
        float scaleFactor = 1.2f + (random.nextFloat() * 0.6f - 0.3f); // Vary scale factor between 0.9 and 1.5
        float offset = random.nextFloat() * 50 - 25; // Vary offset between -25 and 25
        RescaleOp rescaleOp = new RescaleOp(scaleFactor, offset, null);
        rescaleOp.filter(image, image);
    }

    private static void applyRandomizedSharpening(BufferedImage image, Random random) {
        float[] sharpenKernel = {
                -1, -1, -1,
                -1, random.nextFloat() * 6 + 3, -1, // Randomize the center value between 3 and 9
                -1, -1, -1
        };
        BufferedImageOp sharpenOp = new ConvolveOp(new Kernel(3, 3, sharpenKernel));
        BufferedImage sharpenedImage = sharpenOp.filter(image, null);
        Graphics2D g = image.createGraphics();
        g.drawImage(sharpenedImage, 0, 0, null);
        g.dispose();
    }

    private static void applyComplexTexture(BufferedImage image, Random random) {
        int width = image.getWidth();
        int height = image.getHeight();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int pixelValue = new Color(image.getRGB(x, y)).getRed();
                int noise = (int) (random.nextGaussian() * 15); // Gaussian noise for more organic texture
                int newPixelValue = Math.min(255, Math.max(0, pixelValue + noise));
                Color newColor = new Color(newPixelValue, newPixelValue, newPixelValue);
                image.setRGB(x, y, newColor.getRGB());
            }
        }
    }

    /**************************************************************
     * Soft finger print Variation
     ****************************************************************/
    private static BufferedImage applySoftFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Soft";
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        BufferedImage softFingerprint = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = softFingerprint.createGraphics();
        g.drawImage(originalImage, 0, 0, null);
        g.dispose();

        Random random = new Random(seed);

        // Apply slight blur to soften the fingerprint ridges
        applySoftBlur(softFingerprint, random);

        // Reduce contrast to simulate a soft touch
        reduceContrast(softFingerprint, random);

        // Slightly distort the ridges to mimic a soft press
        applyRidgeDistortion(softFingerprint, random);

        return softFingerprint;
    }

    private static void applySoftBlur(BufferedImage image, Random random) {
        float[] blurKernel = {
                1 / 16f, 2 / 16f, 1 / 16f,
                2 / 16f, 4 / 16f, 2 / 16f,
                1 / 16f, 2 / 16f, 1 / 16f
        };
        BufferedImageOp blurOp = new ConvolveOp(new Kernel(3, 3, blurKernel));
        BufferedImage blurredImage = blurOp.filter(image, null);
        Graphics2D g = image.createGraphics();
        g.drawImage(blurredImage, 0, 0, null);
        g.dispose();
    }

    private static void reduceContrast(BufferedImage image, Random random) {
        int width = image.getWidth();
        int height = image.getHeight();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int pixelValue = new Color(image.getRGB(x, y)).getRed();
                int newPixelValue = (int) (pixelValue * 0.85 + 25); // Reduce contrast
                Color newColor = new Color(newPixelValue, newPixelValue, newPixelValue);
                image.setRGB(x, y, newColor.getRGB());
            }
        }
    }

    private static void applyRidgeDistortion(BufferedImage image, Random random) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage distortedImage = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = distortedImage.createGraphics();

        int maxDistortion = 3; // Maximum distortion in pixels
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int distortionX = x + random.nextInt(maxDistortion * 2) - maxDistortion;
                int distortionY = y + random.nextInt(maxDistortion * 2) - maxDistortion;
                distortionX = Math.min(Math.max(distortionX, 0), width - 1);
                distortionY = Math.min(Math.max(distortionY, 0), height - 1);
                distortedImage.setRGB(distortionX, distortionY, image.getRGB(x, y));
            }
        }

        g.drawImage(distortedImage, 0, 0, null);
        g.dispose();
    }

    /********************************************************************
     * Blurry finger print Variation
     * /
     ****************************************************************/
    private static BufferedImage applyBlurryFingerprintVariation(BufferedImage originalImage, int seed) {
        strFingervariation = "Blurry";
        BufferedImage outputImage = new BufferedImage(
                originalImage.getWidth(),
                originalImage.getHeight(),
                originalImage.getType());

        Graphics2D g2d = outputImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, null);

        Random random = new Random(seed);

        // Apply advanced transformations
        applyElasticDistortion(outputImage, random);
        // applyAffineTransformation(outputImage, random);
        // applyMorphologicalTransformations(outputImage, random);
        applyRandomTextures(outputImage, random);

        g2d.dispose();
        return outputImage;
    }

    private static void applyElasticDistortion(BufferedImage image, Random random) {
        int width = image.getWidth();
        int height = image.getHeight();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int dx = (int) (random.nextGaussian() * 3);
                int dy = (int) (random.nextGaussian() * 3);

                int newX = Math.min(Math.max(x + dx, 0), width - 1);
                int newY = Math.min(Math.max(y + dy, 0), height - 1);

                int rgb = image.getRGB(newX, newY);
                image.setRGB(x, y, rgb);
            }
        }
    }

    private static void applyAffineTransformation(BufferedImage image, Random random) {
        Graphics2D g2d = image.createGraphics();
        AffineTransform transform = new AffineTransform();

        // Random scaling
        double scaleX = 1.0 + (random.nextDouble() - 0.5) * 0.1;
        double scaleY = 1.0 + (random.nextDouble() - 0.5) * 0.1;
        transform.scale(scaleX, scaleY);

        // Random rotation
        double rotation = (random.nextDouble() - 0.5) * Math.PI / 8;
        transform.rotate(rotation, image.getWidth() / 2, image.getHeight() / 2);

        // Random translation
        double translateX = (random.nextDouble() - 0.5) * 10;
        double translateY = (random.nextDouble() - 0.5) * 10;
        transform.translate(translateX, translateY);

        g2d.setTransform(transform);
        g2d.drawImage(image, 0, 0, null);
        g2d.dispose();
    }

    private static void applyMorphologicalTransformations(BufferedImage image, Random random) {
        // Apply random erosion and dilation
        float[] kernelData = new float[] {
                random.nextFloat(), random.nextFloat(), random.nextFloat(),
                random.nextFloat(), random.nextFloat(), random.nextFloat(),
                random.nextFloat(), random.nextFloat(), random.nextFloat()
        };

        Kernel kernel = new Kernel(3, 3, kernelData);
        ConvolveOp op = new ConvolveOp(kernel, ConvolveOp.EDGE_NO_OP, null);
        op.filter(image, null);
    }

    private static void applyRandomTextures(BufferedImage image, Random random) {
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                if (random.nextDouble() < 0.05) { // 5% chance to alter texture
                    int rgb = image.getRGB(x, y);
                    int newRgb = rgb ^ (random.nextInt() & 0x00FFFFFF);
                    image.setRGB(x, y, newRgb);
                }
            }
        }
    }
}