import AppError from "../utils/appError.ts";
import { PrismaClient } from "../prisma/generated/index.js";
import type { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();

export async function findMovie(movie_id: number) {
  const movie = await prisma.movie.findUnique({ where: { movie_id } });
  if (movie === null) {
    throw new AppError("No movie with this id exists", 404);
  }
  return movie;
}

async function retrieveMovies(req: Request, res: Response, next: NextFunction) {
  const movieId = Number(req.params?.movieId);
  const showTimesFilter = req.url.split("/")[2];
  if (showTimesFilter) {
    const showTimes = await prisma.showTime.findMany({
      where: { movie_id: movieId },
      omit: { movie_id: true },
    });
    return res.status(200).json({
      showTimes,
    });
  }
  if (movieId && !showTimesFilter) {
    let movie = await prisma.movie.findUnique({
      where: { movie_id: movieId },
    });
    return res.json(movie);
  }
  let movies = await prisma.movie.findMany();
  res.json(movies);
}

async function addMovie(req: Request, res: Response, next: NextFunction) {
  const title = req.body.title;
  const category = req.body.category;
  if (!title || !category)
    return next(new AppError("title or category is not declared", 400));
  let movie;
  movie = await prisma.movie.create({
    data: {
      title,
      category,
    },
  });

  res.status(201).json({
    status: "ok",
    id: movie.movie_id,
    msg: "movie added successfully.",
  });
}

async function deleteMovie(req: Request, res: Response, next: NextFunction) {
  if (!req.body) {
    return next(new AppError("body is not provided", 400));
  }
  const movie_id = req.body.movie_id;
  if (!movie_id || typeof movie_id !== "number") {
    return next(new AppError("movie_id is undefined or not a number", 400));
  }
  const movie = await prisma.movie.delete({ where: { movie_id } });
  res.status(200).json({
    status: "OK",
    msg: `movie ${movie.movie_id} deleted`,
  });
}

export { retrieveMovies, addMovie, deleteMovie };
